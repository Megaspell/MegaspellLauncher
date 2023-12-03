import path from 'path';
import fs from 'fs';
import { app, ipcMain } from 'electron';
import InstallationService, {
  GetInstallLocationChannel,
  GetVersionInstallDirChannel,
  InstallationStatus,
  InstallOrUpdateChannel,
  InstallStage,
  InstallProgress,
  IsVersionInstalledChannel,
  SetInstallLocationChannel,
} from '../common/InstallationService';
import ReleaseService, { AppRelease } from '../common/ReleaseService';
import StoreService from '../common/StoreService';
import { tempDir } from './util';

const unzipper = require('unzipper');

const defaultInstallLocation: string = path.resolve(
  app.getPath('userData'),
  'game',
);
const installLocationStoreKey = 'gameInstallLocation';

const installLockFilePath: string = path.resolve(
  app.getPath('userData'),
  '.installLock.json',
);

interface InstallLock {
  streamId: string;
  version: string;
}

export default class InstallationServiceImpl implements InstallationService {
  storeService: StoreService;

  releaseService: ReleaseService;

  constructor(storeService: StoreService, releaseService: ReleaseService) {
    this.storeService = storeService;
    this.releaseService = releaseService;
    this.registerIpc();
    this.cleanupInterruptedInstall();
  }

  async getInstallLocation(): Promise<string> {
    const location = this.storeService.get(installLocationStoreKey);
    return location ? location.toString() : defaultInstallLocation;
  }

  async setInstallLocation(location: string): Promise<void> {
    if (!fs.existsSync(location)) {
      await fs.promises.mkdir(location, { recursive: true });
    }

    // Check permissions
    const checkPermFile = path.resolve(location, 'checkCanWrite');
    await fs.promises.writeFile(checkPermFile, '');
    await fs.promises.rm(checkPermFile);

    this.storeService.set(installLocationStoreKey, location);
  }

  async getVersionInstallDir(
    streamId: string,
    version: string,
  ): Promise<string> {
    if (!streamId) {
      throw new Error('streamId is required');
    }
    if (!version) {
      throw new Error('version is required');
    }

    const installLocation = await this.getInstallLocation();
    return path.resolve(installLocation, streamId, version);
  }

  // eslint-disable-next-line class-methods-use-this
  private async cleanupInterruptedInstall() {
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true });
    }

    if (!fs.existsSync(installLockFilePath)) return;

    const installLock = await fs.promises
      .readFile(installLockFilePath, 'utf8')
      .then((text) => JSON.parse(text) as InstallLock)
      .catch(() => null);

    if (installLock) {
      const versionDir = await this.getVersionInstallDir(
        installLock.streamId,
        installLock.version,
      );
      if (fs.existsSync(versionDir)) {
        await fs.promises.rm(versionDir, { recursive: true });
      }
      await fs.promises.rm(installLockFilePath);
    }
  }

  async isVersionInstalled(
    streamId: string,
    version: string,
  ): Promise<InstallationStatus> {
    const versionDir = await this.getVersionInstallDir(streamId, version);
    const dirNotEmpty = await fs.promises
      .readdir(versionDir)
      .then((dir) => dir.length > 0)
      .catch(() => false);

    if (!dirNotEmpty) return { installed: false };

    const versionFile = path.resolve(versionDir, '.version');
    const versionFromFile = await fs.promises
      .readFile(versionFile, 'utf8')
      .catch(() => null);

    return {
      installed: !!versionFromFile,
      realVersion: versionFromFile ?? undefined,
    };
  }

  async installOrUpdate(
    streamId: string,
    version: string,
    force: boolean,
    onStatusChange: (status: InstallProgress) => void,
  ) {
    try {
      if (fs.existsSync(installLockFilePath)) {
        return;
      }
      const installLock: InstallLock = { streamId, version };
      await fs.promises.writeFile(
        installLockFilePath,
        JSON.stringify(installLock),
        {
          flag: 'wx',
        },
      );

      const installDir = await this.getVersionInstallDir(streamId, version);

      await this.tryInstallOrUpdate(
        streamId,
        version,
        installDir,
        force,
        onStatusChange,
      );

      await fs.promises.rm(installLockFilePath);
    } catch (e) {
      onStatusChange({
        stage: InstallStage.Failed,
        error: e,
      } as InstallProgress);
      await this.cleanupInterruptedInstall();
    }
  }

  private async tryInstallOrUpdate(
    streamId: string,
    version: string,
    installDir: string,
    force: boolean,
    onStatusChange: (status: InstallProgress) => void,
  ) {
    const status = {
      stage: InstallStage.RequestingLatestReleaseInfo,
      stageProgress: 0,
    } as InstallProgress;

    onStatusChange(status);

    const installationStatus = await this.isVersionInstalled(streamId, version);
    const stream = (await this.releaseService.getStreams()).find(
      (s) => s.id === streamId,
    );
    if (!stream) {
      status.stage = InstallStage.Failed;
      status.error = new Error(`Release stream ${streamId} not found`);
      onStatusChange(status);
      return;
    }

    const appRelease: AppRelease | null =
      force || !installationStatus.installed
        ? await this.releaseService.getRelease(stream, version)
        : await this.releaseService.findUpdate(
            stream,
            installationStatus.realVersion!,
          );

    if (!appRelease) {
      status.stage = InstallStage.AlreadyLatest;
      onStatusChange(status);
      return;
    }

    status.version = appRelease.version;
    status.downloadSize = appRelease.downloadSize;
    status.stage = InstallStage.PreCleanup;
    onStatusChange(status);

    if (fs.existsSync(installDir)) {
      await fs.promises.rm(installDir, { recursive: true });
    }

    await fs.promises.mkdir(installDir, { recursive: true });

    status.stage = InstallStage.Downloading;
    onStatusChange(status);

    const { artifactPath } = await this.releaseService.downloadReleaseArtifact(
      stream,
      appRelease.version,
      tempDir,
      (bytesDownloaded) => {
        status.stageProgress = bytesDownloaded / appRelease.downloadSize;
        onStatusChange(status);
      },
    );

    status.stage = InstallStage.Installing;
    status.stageProgress = 0;
    await this.unpackArtifact(installDir, artifactPath, (bytes) => {
      status.stageProgress = bytes / appRelease.downloadSize;
      onStatusChange(status);
    });
    onStatusChange(status);

    const versionFile = path.resolve(installDir, '.version');
    await fs.promises.writeFile(versionFile, appRelease.version, { flag: 'w' });

    status.stage = InstallStage.PostCleanup;
    status.stageProgress = 0;
    onStatusChange(status);
    await fs.promises.rm(artifactPath);

    status.stage = InstallStage.Complete;
    onStatusChange(status);
  }

  // eslint-disable-next-line class-methods-use-this
  private async unpackArtifact(
    installDir: string,
    artifactPath: string,
    onUnpackedBytes: (bytes: number) => void,
  ) {
    let processedSize = 0;
    await fs
      .createReadStream(artifactPath)
      .pipe(unzipper.Parse())
      .on('entry', (entry: any) => {
        const file = path.resolve(installDir, entry.path);
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
      .catch((e: Error) => console.log('Failed to unzip artifact', e));
  }

  private registerIpc() {
    ipcMain.handle(GetInstallLocationChannel, async () => {
      return this.getInstallLocation();
    });
    ipcMain.handle(
      SetInstallLocationChannel,
      async (event, location: string) => {
        return this.setInstallLocation(location);
      },
    );
    ipcMain.handle(
      GetVersionInstallDirChannel,
      async (event, streamId: string, version: string) => {
        return this.getVersionInstallDir(streamId, version);
      },
    );
    ipcMain.handle(
      IsVersionInstalledChannel,
      async (event, streamId: string, version: string) => {
        return this.isVersionInstalled(streamId, version);
      },
    );
    ipcMain.handle(
      InstallOrUpdateChannel,
      async (event, streamId: string, version: string, force: boolean) => {
        await this.installOrUpdate(streamId, version, force, (status) =>
          event.sender.send(InstallOrUpdateChannel, status),
        );
      },
    );
  }
}
