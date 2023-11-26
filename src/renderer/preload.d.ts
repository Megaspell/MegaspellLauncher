import GameInstallationService from '../common/GameInstallationService';
import StoreService from '../common/StoreService';
import GameLaunchService from '../common/GameLaunchService';
import AppService from '../common/AppService';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    appApi: AppService;
    storeApi: StoreService;
    installationApi: GameInstallationService;
    launchApi: GameLaunchService;
  }
}

export {};
