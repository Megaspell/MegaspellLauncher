export enum InstallStage {
  Failed,
  RequestingLatestReleaseInfo,
  AlreadyLatest,
  PreCleanup,
  Downloading,
  Installing,
  PostCleanup,
  Complete,
}

export interface InstallProgress {
  stage: InstallStage;
  /**
   * Progress from 0 to 1.
   */
  stageProgress: number;
  version: string;
  /**
   * Download size in bytes.
   */
  downloadSize: number;
  error: string;
}

export interface InstallationStatus {
  installed: boolean;
  /**
   * For pseudo-versions like {@link LatestVersion} contains the real installed version.
   */
  realVersion?: string;
}

export const GetInstallLocationChannel = 'installationApi.getInstallLocation';
export const SetInstallLocationChannel = 'installationApi.setInstallLocation';
export const GetVersionInstallDirChannel =
  'installationApi.getVersionInstallDir';
export const IsVersionInstalledChannel = 'installationApi.isVersionInstalled';
export const AreVersionsInstalledChannel =
  'installationApi.areVersionsInstalled';
export const InstallOrUpdateChannel = 'installationApi.installOrUpdate';

export default interface InstallationService {
  getInstallLocation(): Promise<string>;

  setInstallLocation(location: string): Promise<void>;

  getVersionInstallDir(streamId: string, version: string): Promise<string>;

  /**
   * Check if version is installed. Does not check for installation integrity.
   * Also, does not check if installed {@link LatestVersion} is actually the latest.
   * @param streamId release stream ID.
   * @param version version ID, or {@link LatestVersion}.
   */
  isVersionInstalled(
    streamId: string,
    version: string,
  ): Promise<InstallationStatus>;

  /**
   * Batch version of {@link isVersionInstalled}
   * Returned array is matching order of {@link versions}.
   */
  areVersionsInstalled(
    streamId: string,
    versions: string[],
  ): Promise<InstallationStatus[]>;

  installOrUpdate(
    streamId: string,
    version: string,
    force: boolean,
    onStatusChange: (status: InstallProgress) => void,
  ): Promise<void>;
}
