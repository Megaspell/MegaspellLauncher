export const LatestVersion = 'latest';

export enum ReleaseStreamType {
  GitHub = 'GitHub',
}

export interface ReleaseStream {
  id: string;

  type: ReleaseStreamType;
  /**
   * In format "Owner/Repository".
   */
  githubRepository: string;
  /**
   * Required for private repositories.
   */
  githubToken?: string;
}

export const DefaultReleaseStream: ReleaseStream = {
  id: 'default',
  type: ReleaseStreamType.GitHub,
  githubRepository: 'Megaspell/Megaspell-Releases',
};

export interface AppRelease {
  version: string;
  changelog?: string;
  publishedAt?: string;
  /**
   * Download size in bytes for current platform.
   */
  downloadSize: number;
}

export interface DownloadedArtifact {
  version: string;
  artifactPath: string;
}

export const GetReleaseStreamsChannel = 'releaseStreamApi.getStreams';
export const AddReleaseStreamChannel = 'releaseStreamApi.addStream';
export const RemoveReleaseStreamChannel = 'releaseStreamApi.removeStream';
export const GetLastReleasesChannel = 'releaseStreamApi.getLastReleases';
export const GetReleaseChannel = 'releaseStreamApi.getRelease';
export const FindUpdateChannel = 'releaseStreamApi.findUpdate';

export default interface ReleaseService {
  /**
   * Get all release streams. The {@link DefaultReleaseStream} is always first.
   */
  getStreams(): Promise<ReleaseStream[]>;

  /**
   * If stream with the same {@link ReleaseStream.githubRepository} already exists, a call will update other properties.
   */
  addStream(stream: ReleaseStream): Promise<boolean>;

  removeStream(stream: ReleaseStream): Promise<boolean>;

  /**
   * Get last {@link limit} app releases, ordered starting from most recent.
   * Release provider may have its own limit smaller than provided one.
   */
  getLastReleases(stream: ReleaseStream, limit: number): Promise<AppRelease[]>;

  /**
   * Get release by version from stream if it exists.
   */
  getRelease(
    stream: ReleaseStream,
    version: string,
  ): Promise<AppRelease | null>;

  /**
   * Get release info for update from this version. Passing {@link LatestVersion} pseudo-version is not allowed.
   */
  findUpdate(
    stream: ReleaseStream,
    version: string,
  ): Promise<AppRelease | null>;

  /**
   * Passing {@link LatestVersion} pseudo-version not allowed.
   */
  downloadReleaseArtifact(
    stream: ReleaseStream,
    version: string,
    destination: string,
    onDownloadProgress: (bytesDownloaded: number) => void,
  ): Promise<DownloadedArtifact>;
}
