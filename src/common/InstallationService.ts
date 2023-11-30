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
  error: Error;
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
export const InstallOrUpdateChannel = 'installationApi.installOrUpdate';

export default interface InstallationService {
  getInstallLocation(): Promise<string>;

  setInstallLocation(location: string): Promise<void>;

  getVersionInstallDir(streamId: string, version: string): Promise<string>;

  isVersionInstalled(
    streamId: string,
    version: string,
  ): Promise<InstallationStatus>;

  installOrUpdate(
    streamId: string,
    version: string,
    force: boolean,
    onStatusChange: (status: InstallProgress) => void,
  ): Promise<void>;
}
