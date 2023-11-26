// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

import AppService, {
  CloseChannel,
  MinimizeChannel,
  ShowMessageBoxChannel,
} from '../common/AppService';
import StoreService, {
  StoreGetChannel,
  StoreSetChannel,
} from '../common/StoreService';
import GameInstallationService, {
  CheckAvailableUpdateChannel,
  DownloadOrUpdateChannel,
  GetInstalledVersionChannel,
  UpdateStatus,
} from '../common/GameInstallationService';
import GameLaunchService, {
  LaunchGameChannel,
} from '../common/GameLaunchService';

const appApi: AppService = {
  minimize: () => ipcRenderer.send(MinimizeChannel),
  close: () => ipcRenderer.send(CloseChannel),
  showMessageBox: (title: string, message: string, type: string) =>
    ipcRenderer.send(ShowMessageBoxChannel, title, message, type),
};

const storeApi: StoreService = {
  get(key: string) {
    return ipcRenderer.sendSync(StoreGetChannel, key);
  },
  set(key: string, value: object | string | number) {
    ipcRenderer.send(StoreSetChannel, key, value);
  },
};

const installationApi: GameInstallationService = {
  getInstalledVersion: () => ipcRenderer.invoke(GetInstalledVersionChannel),

  checkAvailableUpdate: () => ipcRenderer.invoke(CheckAvailableUpdateChannel),

  downloadOrUpdate: async (
    force: boolean,
    onStatusChange: (status: UpdateStatus) => void,
  ) => {
    const listener = (event, status: UpdateStatus) => onStatusChange(status);
    ipcRenderer.on(DownloadOrUpdateChannel, listener);
    // eslint-disable-next-line promise/catch-or-return
    await ipcRenderer.invoke(DownloadOrUpdateChannel, force).finally(() => {
      ipcRenderer.removeListener(DownloadOrUpdateChannel, listener);
    });
  },
};

const launchApi: GameLaunchService = {
  launchGame: async () => {
    await ipcRenderer.invoke(LaunchGameChannel);
  },
};

contextBridge.exposeInMainWorld('appApi', appApi);
contextBridge.exposeInMainWorld('storeApi', storeApi);
contextBridge.exposeInMainWorld('installationApi', installationApi);
contextBridge.exposeInMainWorld('launchApi', launchApi);
