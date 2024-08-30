// eslint-disable-next-line camelcase
import child_process from 'child_process';
import { ChildProcess } from 'node:child_process';
import EventEmitter from 'node:events';
import { ipcMain } from 'electron';
import path from 'path';
import LaunchService, {
  GetCurrentAppVersionChannel,
  GetCurrentReleaseStreamChannel,
  GetGraphicsApiChannel,
  GraphicsApi,
  LaunchAppChannel,
  SetCurrentAppVersionChannel,
  SetCurrentReleaseStreamChannel,
  SetGraphicsApiChannel,
} from '../common/LaunchService';
import { getExecutableName } from './util';
import ReleaseService, {
  DefaultReleaseStream,
  LatestVersion,
  ReleaseStream,
} from '../common/ReleaseService';
import InstallationService from '../common/InstallationService';
import StoreService from '../common/StoreService';

const currentReleaseStreamStoreKey = 'currentReleaseStream';
const currentAppVersionStoreKey = 'currentAppVersion';
const graphicsApiStoreKey = 'graphicsApi';

export default class LaunchServiceImpl implements LaunchService {
  private storeService: StoreService;

  private releaseStreamService: ReleaseService;

  private gameInstallationService: InstallationService;

  private currentGameProcess: ChildProcess | null = null;

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

  async getGraphicsApi(): Promise<GraphicsApi | null> {
    const value = this.storeService.get(graphicsApiStoreKey);
    if (
      typeof value === 'string' &&
      Object.values(GraphicsApi).includes(value as GraphicsApi)
    ) {
      return value as GraphicsApi;
    }
    return null;
  }

  async setGraphicsApi(api: GraphicsApi | null): Promise<void> {
    if (api) {
      this.storeService.set(graphicsApiStoreKey, api);
    } else {
      this.storeService.delete(graphicsApiStoreKey);
    }
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

    const executablePath = path.resolve(versionDir, getExecutableName());

    const args = await this.buildArgs();

    // eslint-disable-next-line camelcase
    this.currentGameProcess = child_process.spawn(executablePath, args, {
      detached: true,
    });

    const bus = new EventEmitter();

    this.currentGameProcess.on('exit', () => {
      this.currentGameProcess = null;
      bus.emit('exit');
    });

    await new Promise((resolve) => {
      bus.once('exit', resolve);
    });
  }

  private async buildArgs(): Promise<string[]> {
    const args: string[] = [];

    const graphicsApi = await this.getGraphicsApi();
    if (graphicsApi) {
      switch (graphicsApi) {
        case GraphicsApi.Vulkan:
          args.push('-force-vulkan');
          break;
        case GraphicsApi.DX12:
          args.push('-force-d3d12');
          break;
        case GraphicsApi.DX11:
          args.push('-force-d3d11');
          break;
        default:
          break;
      }
    }

    return args;
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
    ipcMain.handle(GetGraphicsApiChannel, () => this.getGraphicsApi());
    ipcMain.handle(SetGraphicsApiChannel, (event, api: GraphicsApi | null) =>
      this.setGraphicsApi(api),
    );
    ipcMain.handle(LaunchAppChannel, () => this.launchApp());
  }
}
