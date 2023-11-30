import InstallationService from '../common/InstallationService';
import LaunchService from '../common/LaunchService';
import AppService from '../common/AppService';
import ReleaseService from '../common/ReleaseService';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    appApi: AppService;
    releaseStreamApi: ReleaseService;
    installationApi: InstallationService;
    launchApi: LaunchService;
  }
}

export {};
