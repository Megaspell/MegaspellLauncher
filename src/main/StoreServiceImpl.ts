import Store from 'electron-store';
import { ipcMain } from 'electron';
import StoreService from '../common/StoreService';

export default class StoreServiceImpl implements StoreService {
  private store: Store;

  constructor() {
    this.registerIpc();

    this.store = new Store();
  }

  get(key: string) {
    return this.store.get(key);
  }

  set(key: string, value: object | string | number) {
    return this.store.set(key, value);
  }

  private registerIpc() {
    ipcMain.on('electron-store-get', async (event, val) => {
      event.returnValue = this.get(val);
    });
    ipcMain.on('electron-store-set', async (event, key, val) => {
      this.set(key, val);
    });
  }
}
