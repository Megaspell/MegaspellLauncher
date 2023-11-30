import { ReleaseStream } from './ReleaseService';

export const GetCurrentReleaseStreamChannel =
  'launchApi.getCurrentReleaseStream';
export const SetCurrentReleaseStreamChannel =
  'launchApi.setCurrentReleaseStream';
export const GetCurrentAppVersionChannel = 'launchApi.getCurrentAppVersion';
export const SetCurrentAppVersionChannel = 'launchApi.setCurrentAppVersion';

export const LaunchAppChannel = 'launchApi.launchApp';

export default interface LaunchService {
  getCurrentReleaseStream(): Promise<ReleaseStream>;

  /**
   * Pass null to reset to default.
   */
  setCurrentReleaseStream(streamId: string | null): Promise<boolean>;

  /**
   * May return {@link LatestVersion} or version tag.
   */
  getCurrentAppVersion(): Promise<string>;

  /**
   * Pass {@link LatestVersion} or null to reset to default.
   */
  setCurrentAppVersion(version: string | null): Promise<boolean>;

  launchApp(): Promise<void>;
}
