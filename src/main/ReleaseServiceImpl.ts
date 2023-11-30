import { ipcMain } from 'electron';
import StoreService from '../common/StoreService';
import ReleaseService, {
  AddReleaseStreamChannel,
  AppRelease,
  DefaultReleaseStream,
  DownloadedArtifact,
  FindUpdateChannel,
  GetLastReleasesChannel,
  GetReleaseChannel,
  GetReleaseStreamsChannel,
  ReleaseStream,
  ReleaseStreamType,
  RemoveReleaseStreamChannel,
} from '../common/ReleaseService';
import ReleaseProvider from './ReleaseProvider';
import GithubReleaseProvider from './GithubReleaseProvider';

const streamsStoreKey = 'customReleaseStreams';

export default class ReleaseServiceImpl implements ReleaseService {
  private storeService: StoreService;

  private githubProvider: ReleaseProvider;

  constructor(storeService: StoreService) {
    this.storeService = storeService;

    this.githubProvider = new GithubReleaseProvider();

    this.registerIpc();
  }

  async getStreams(): Promise<ReleaseStream[]> {
    return [DefaultReleaseStream].concat(this.getStoredStreams());
  }

  async addStream(stream: ReleaseStream): Promise<boolean> {
    if (stream.id === DefaultReleaseStream.id) {
      return false;
    }

    const storedStreams = this.getStoredStreams();

    const existingStreamIndex = storedStreams.findIndex(
      (s) => s.id === stream.id,
    );
    if (existingStreamIndex >= 0) {
      storedStreams[existingStreamIndex] = stream;
      this.setStoredStreams(storedStreams);
      return true;
    }

    this.setStoredStreams(storedStreams.concat([stream]));
    return true;
  }

  async removeStream(stream: ReleaseStream): Promise<boolean> {
    if (stream.id === DefaultReleaseStream.id) {
      return false;
    }

    const storedStreams = this.getStoredStreams();

    const existingStreamIndex = storedStreams.findIndex(
      (s) => s.id === stream.id,
    );
    if (existingStreamIndex < 0) {
      return false;
    }

    storedStreams.splice(existingStreamIndex, 1);
    this.setStoredStreams(storedStreams);
    return true;
  }

  private getStoredStreams(): ReleaseStream[] {
    const storeEntry = this.storeService.get(streamsStoreKey);
    return storeEntry && Array.isArray(storeEntry)
      ? ([...storeEntry] as ReleaseStream[])
      : [];
  }

  private setStoredStreams(streams: ReleaseStream[]) {
    this.storeService.set(streamsStoreKey, [...streams]);
  }

  getLastReleases(
    stream: ReleaseStream,
    limit: number = 50,
  ): Promise<AppRelease[]> {
    return this.getProviderForStream(stream).getLastReleases(stream, limit);
  }

  getRelease(
    stream: ReleaseStream,
    version: string,
  ): Promise<AppRelease | null> {
    return this.getProviderForStream(stream).getRelease(stream, version);
  }

  findUpdate(
    stream: ReleaseStream,
    version: string,
  ): Promise<AppRelease | null> {
    return this.getProviderForStream(stream).findUpdate(stream, version);
  }

  async downloadReleaseArtifact(
    stream: ReleaseStream,
    version: string,
    destination: string,
    onDownloadProgress: (bytesDownloaded: number) => void,
  ): Promise<DownloadedArtifact> {
    return this.getProviderForStream(stream).downloadReleaseArtifact(
      stream,
      version,
      destination,
      onDownloadProgress,
    );
  }

  private getProviderForStream(stream: ReleaseStream): ReleaseProvider {
    switch (stream.type) {
      case ReleaseStreamType.GitHub:
        return this.githubProvider;
      default:
        throw new Error(`Unsupported stream type: ${stream.type}`);
    }
  }

  private registerIpc() {
    ipcMain.handle(GetReleaseStreamsChannel, () => this.getStreams());
    ipcMain.handle(AddReleaseStreamChannel, (event, stream) =>
      this.addStream(stream),
    );
    ipcMain.handle(RemoveReleaseStreamChannel, (event, stream) =>
      this.removeStream(stream),
    );
    ipcMain.handle(GetLastReleasesChannel, (event, stream: ReleaseStream) =>
      this.getLastReleases(stream),
    );
    ipcMain.handle(
      GetReleaseChannel,
      (event, stream: ReleaseStream, version: string) =>
        this.getRelease(stream, version),
    );
    ipcMain.handle(
      FindUpdateChannel,
      (event, stream: ReleaseStream, version: string) =>
        this.findUpdate(stream, version),
    );
  }
}
