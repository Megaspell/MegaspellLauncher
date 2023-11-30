import {
  AppRelease,
  DownloadedArtifact,
  ReleaseStream,
} from '../common/ReleaseService';

export default interface ReleaseProvider {
  /**
   * Get last {@link limit} app versions, ordered starting from most recent.
   * Release provider may have its own limit smaller than provided one.
   */
  getLastReleases(stream: ReleaseStream, limit: number): Promise<AppRelease[]>;

  /**
   * Get version object from stream if it exists. Passing {@link LatestVersion} will return the last version.
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
