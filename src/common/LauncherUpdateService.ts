export const GetAvailableUpdateChannel = 'launcherUpdateApi.getAvailableUpdate';

export interface LauncherUpdate {
  currentVersion: string;
  updateVersion: string;
  updateDate: string;
  url: string;
}

export default interface LauncherUpdateService {
  getAvailableUpdate(): Promise<LauncherUpdate | null>;
}
