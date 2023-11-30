// eslint-disable-next-line camelcase
import child_process from 'child_process';
import { ChildProcess } from 'node:child_process';
import EventEmitter from 'node:events';
import { ipcMain } from 'electron';
import path from 'path';
import LaunchService, {
  GetCurrentAppVersionChannel,
  GetCurrentReleaseStreamChannel,
  LaunchAppChannel,
  SetCurrentAppVersionChannel,
  SetCurrentReleaseStreamChannel,
} from '../common/LaunchService';
import { currentPlatform } from './util';
import TargetPlatform from '../common/TargetPlatform';
import ReleaseService, {
  DefaultReleaseStream,
  LatestVersion,
  ReleaseStream,
} from '../common/ReleaseService';
import InstallationService from '../common/InstallationService';
import StoreService from '../common/StoreService';

const currentReleaseStreamStoreKey = 'currentReleaseStream';
const currentAppVersionStoreKey = 'currentAppVersion';

export default class LaunchServiceImpl implements LaunchService {
  private storeService: StoreService;

  private releaseStreamService: ReleaseService;

  private gameInstallationService: InstallationService;

  private currentGameProcess?: ChildProcess;

  constructor(
    storeService: StoreService,
    releaseStreamService: ReleaseService,
    gameInstallationService: InstallationService,
  ) {
    this.registerIpc();
    this.storeService = storeService;
    this.releaseStreamService = releaseStreamService;
    this.gameInstallationService = gameInstallationService;
  }

  async getCurrentReleaseStream(): Promise<ReleaseStream> {
    const currentId = this.storeService.get(currentReleaseStreamStoreKey);
    if (!currentId) return DefaultReleaseStream;

    const existing = await this.releaseStreamService
      .getStreams()
      .then((streams) => streams.find((s) => s.id === currentId));
    if (!existing) {
      this.storeService.delete(currentReleaseStreamStoreKey);
      return DefaultReleaseStream;
    }

    return existing;
  }

  async setCurrentReleaseStream(streamId: string | null): Promise<boolean> {
    if (!streamId || streamId === DefaultReleaseStream.id) {
      this.storeService.delete(currentReleaseStreamStoreKey);
      return true;
    }

    const existing = await this.releaseStreamService
      .getStreams()
      .then((streams) => streams.find((s) => s.id === streamId));
    if (!existing) {
      return false;
    }

    this.storeService.set(currentReleaseStreamStoreKey, streamId);
    return true;
  }

  async getCurrentAppVersion(): Promise<string> {
    const currentId = this.storeService.get(currentAppVersionStoreKey);
    return currentId ? currentId.toString() : LatestVersion;
  }

  async setCurrentAppVersion(version: string | null): Promise<boolean> {
    if (!version || version === LatestVersion) {
      this.storeService.delete(currentAppVersionStoreKey);
      return true;
    }

    // Not checking for version existence
    this.storeService.set(currentAppVersionStoreKey, version);
    return true;
  }

  async launchApp() {
    if (this.currentGameProcess && !this.currentGameProcess.exitCode) {
      // Already launched, do nothing
      return;
    }

    const currentReleaseStream = await this.getCurrentReleaseStream();
    const currentAppVersion = await this.getCurrentAppVersion();
    const versionDir = await this.gameInstallationService.getVersionInstallDir(
      currentReleaseStream.id,
      currentAppVersion,
    );

    const executablePath = path.resolve(
      versionDir,
      LaunchServiceImpl.getExecutableName(),
    );

    const bus = new EventEmitter();

    // eslint-disable-next-line camelcase
    this.currentGameProcess = child_process.execFile(executablePath);

    this.currentGameProcess.on('exit', () => {
      this.currentGameProcess = null as ChildProcess;
      bus.emit('exit');
    });

    await new Promise((resolve) => {
      bus.once('exit', resolve);
    });
  }

  private registerIpc() {
    ipcMain.handle(GetCurrentReleaseStreamChannel, () =>
      this.getCurrentReleaseStream(),
    );
    ipcMain.handle(
      SetCurrentReleaseStreamChannel,
      (event, streamId: string | null) =>
        this.setCurrentReleaseStream(streamId),
    );
    ipcMain.handle(GetCurrentAppVersionChannel, () =>
      this.getCurrentAppVersion(),
    );
    ipcMain.handle(
      SetCurrentAppVersionChannel,
      (event, version: string | null) => this.setCurrentAppVersion(version),
    );
    ipcMain.handle(LaunchAppChannel, () => this.launchApp());
  }

  private static getExecutableName(): string {
    switch (currentPlatform) {
      case TargetPlatform.PlayerWindows64:
        return 'Megaspell.exe';
      case TargetPlatform.PlayerLinux64:
      case TargetPlatform.ServerLinux64:
        return 'Megaspell';
      default:
        throw new Error(`Unsupported target: ${currentPlatform}`);
    }
  }
}
