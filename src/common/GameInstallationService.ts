export const GetInstalledVersionChannel = 'installationApi.getInstalledVersion';
export const CheckAvailableUpdateChannel =
  'installationApi.checkAvailableUpdate';
export const DownloadOrUpdateChannel = 'installationApi.downloadOrUpdate';

export interface ReleaseAsset {
  id: string;
  url: string;
  name: string;
  content_type: string;
  size: number;
}

export interface ReleaseInfo {
  tag_name: number;
  assets: ReleaseAsset[];
}

export interface CheckAvailableUpdateResponse {
  currentVersion: number;
  error?: Error;
  available: boolean;
  releaseInfo?: ReleaseInfo;
}

export enum UpdateStage {
  Failed,
  RequestingLatestReleaseInfo,
  AlreadyLatest,
  PreCleanup,
  Downloading,
  Installing,
  PostCleanup,
  Complete,
}

export interface UpdateStatus {
  stage: UpdateStage;
  /**
   * Progress from 0 to 1.
   */
  stageProgress: number;
  version: number;
  /**
   * Download size in bytes.
   */
  downloadSize: number;
  error: Error;
}

export default interface GameInstallationService {
  getInstalledVersion(): Promise<number>;

  checkAvailableUpdate(): Promise<CheckAvailableUpdateResponse>;

  downloadOrUpdate(
    force: boolean,
    onStatusChange: (status: UpdateStatus) => void,
  ): Promise<void>;
}
