import path from 'path';
import fs from 'fs';
import { app, ipcMain } from 'electron';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import LauncherConfig from './LauncherConfig';
import GameInstallationService, {
  CheckAvailableUpdateChannel,
  CheckAvailableUpdateResponse,
  DownloadOrUpdateChannel,
  GetInstalledVersionChannel,
  ReleaseAsset,
  ReleaseInfo,
  UpdateStage,
  UpdateStatus,
} from '../common/GameInstallationService';
import { currentGameTarget, installPath } from './util';

const unzipper = require('unzipper');

export default class GameInstallationServiceImpl
  implements GameInstallationService
{
  launcherConfig: LauncherConfig;

  constructor(launcherConfig: LauncherConfig) {
    this.launcherConfig = launcherConfig;
    this.registerIpc();
    this.cleanupInterruptedInstall();
  }

  // eslint-disable-next-line class-methods-use-this
  private cleanupInterruptedInstall() {
    const installLockFile = path.resolve(installPath, '.installLock');
    if (fs.existsSync(installLockFile)) {
      fs.rmSync(installPath, { recursive: true });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async getInstalledVersion(): Promise<number> {
    const versionFile: string = path.resolve(installPath, '.version');
    return fs.promises
      .readFile(versionFile, 'utf8')
      .then((versionStr) => parseInt(versionStr, 10))
      .catch(() => null);
  }

  async checkAvailableUpdate(): Promise<CheckAvailableUpdateResponse> {
    const installedVersion = await this.getInstalledVersion();

    try {
      const latestReleaseInfo = await this.fetchLatestReleaseInfo();
      return {
        currentVersion: installedVersion,
        available:
          installedVersion == null ||
          installedVersion < latestReleaseInfo.tag_name,
        releaseInfo: latestReleaseInfo,
      } as CheckAvailableUpdateResponse;
    } catch (e) {
      return {
        currentVersion: installedVersion,
        available: false,
        error: e,
        releaseInfo: null,
      } as CheckAvailableUpdateResponse;
    }
  }

  async fetchLatestReleaseInfo(): Promise<ReleaseInfo> {
    const url = `https://api.github.com/repos/${this.launcherConfig.releasesRepository}/releases/latest`;

    const headers = {
      Accept: 'application/json',
    };
    if (this.launcherConfig.githubToken) {
      // eslint-disable-next-line dot-notation
      headers['Authorization'] = `Bearer ${this.launcherConfig.githubToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(
        `Latest release check on GitHub has failed: ${response.statusText}`,
      );
    }
    return (await response.json()) as ReleaseInfo;
  }

  async downloadOrUpdate(
    force: boolean,
    onStatusChange: (status: UpdateStatus) => void,
  ) {
    try {
      const installLockFile = path.resolve(installPath, '.installLock');
      if (fs.existsSync(installLockFile)) {
        return;
      }
      fs.mkdirSync(installPath);
      fs.writeFileSync(installLockFile, '');

      await this.tryUpdate(force, onStatusChange);

      await fs.promises.rm(installLockFile);
    } catch (e) {
      onStatusChange({
        stage: UpdateStage.Failed,
        error: e,
      } as UpdateStatus);
    } finally {
      this.cleanupInterruptedInstall();
    }
  }

  private async tryUpdate(
    force: boolean,
    onStatusChange: (status: UpdateStatus) => void,
  ) {
    const status = {
      stage: UpdateStage.RequestingLatestReleaseInfo,
    } as UpdateStatus;

    onStatusChange(status);

    const checkUpdateResponse = await this.checkAvailableUpdate();

    if (checkUpdateResponse.error) {
      status.stage = UpdateStage.Failed;
      status.error = checkUpdateResponse.error;
      onStatusChange(status);
      return;
    }

    status.version = checkUpdateResponse.releaseInfo?.tag_name as number;

    if (!checkUpdateResponse.available && !force) {
      status.stage = UpdateStage.AlreadyLatest;
      onStatusChange(status);
      return;
    }

    const assets: ReleaseAsset[] = checkUpdateResponse.releaseInfo
      ?.assets as ReleaseAsset[];
    if (!assets || assets.length === 0) {
      status.stage = UpdateStage.Failed;
      status.error = new Error('No release artifacts received');
      return;
    }

    const targetArtifact: ReleaseAsset = assets.find(
      (asset) => asset.name === `${currentGameTarget}.zip`,
    ) as ReleaseAsset;

    if (!targetArtifact) {
      status.stage = UpdateStage.Failed;
      status.error = new Error(
        'No release artifact found for current platform',
      );
      return;
    }

    status.downloadSize = targetArtifact.size;

    status.stage = UpdateStage.PreCleanup;
    if (fs.existsSync(installPath)) {
      await fs.promises.rm(installPath, { recursive: true });
    }

    status.stage = UpdateStage.Downloading;
    const tempArtifactLocation = await this.downloadArtifactToTemp(
      targetArtifact,
      (progress) => {
        status.stageProgress = progress;
        onStatusChange(status);
      },
    );

    status.stage = UpdateStage.Installing;
    status.stageProgress = 0;
    await this.unpackArtifact(tempArtifactLocation, (bytes) => {
      status.stageProgress = bytes / targetArtifact.size;
      onStatusChange(status);
    });
    onStatusChange(status);

    status.stage = UpdateStage.PostCleanup;
    status.stageProgress = 0;
    await fs.promises.rm(tempArtifactLocation, { recursive: true });

    status.stage = UpdateStage.Complete;
  }

  private async downloadArtifactToTemp(
    artifact: ReleaseAsset,
    onProgressChange: (number) => void,
  ): Promise<string> {
    const headers = {
      Accept: 'application/octet-stream',
    };
    if (this.launcherConfig.githubToken) {
      // eslint-disable-next-line dot-notation
      headers['Authorization'] = `Bearer ${this.launcherConfig.githubToken}`;
    }

    const downloadPath = path.resolve(app.getPath('temp'), artifact.name);
    if (fs.existsSync(downloadPath)) {
      await fs.promises.rm(downloadPath);
    }

    let downloaded = 0;

    const response = await fetch(artifact.url, { headers });
    const fileStream = fs.createWriteStream(downloadPath, { flags: 'wx' });

    await finished(
      Readable.fromWeb(response.body as ReadableStream)
        .on('data', (chunk) => {
          downloaded += chunk.length;
          onProgressChange(downloaded / artifact.size);
        })
        .pipe(fileStream),
    );
    return downloadPath;
  }

  // eslint-disable-next-line class-methods-use-this
  private async unpackArtifact(
    artifactPath: string,
    onUnpackedBytes: (bytes: number) => void,
  ) {
    let processedSize = 0;
    await fs
      .createReadStream(artifactPath)
      .pipe(unzipper.Parse())
      .on('entry', (entry) => {
        const file = path.resolve(installPath, entry.path);
        if (entry.type === 'Directory') {
          return;
        }

        fs.mkdirSync(path.dirname(file), { recursive: true });
        const fileStream = fs.createWriteStream(file);
        fileStream.on('close', () => {
          processedSize += entry.vars.compressedSize;
          onUnpackedBytes(processedSize);
        });
        entry.pipe(fileStream);
      })
      .promise()
      .then(() => console.log('done'))
      .catch((e) => console.log('Failed to unzip artifact', e));
  }

  private registerIpc() {
    ipcMain.handle(GetInstalledVersionChannel, async () => {
      return this.getInstalledVersion();
    });
    ipcMain.handle(CheckAvailableUpdateChannel, async () => {
      return this.checkAvailableUpdate();
    });
    ipcMain.handle(DownloadOrUpdateChannel, async (event, force: boolean) => {
      await this.downloadOrUpdate(force, (status) =>
        event.sender.send(DownloadOrUpdateChannel, status),
      );
    });
  }
}
