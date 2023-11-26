import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  MessageBoxSyncOptions,
} from 'electron';
import AppService, {
  CloseChannel,
  MinimizeChannel,
  ShowMessageBoxChannel,
} from '../common/AppService';

export default class AppServiceImpl implements AppService {
  private windowSupplier: () => BrowserWindow | null;

  constructor(windowSupplier: () => BrowserWindow | null) {
    this.windowSupplier = windowSupplier;
    this.registerIpc();
  }

  minimize() {
    this.windowSupplier()?.minimize();
  }

  // eslint-disable-next-line class-methods-use-this
  close() {
    app.quit();
  }

  showMessageBox(title: string, message: string, type: string) {
    const mainWindow = this.windowSupplier();
    if (!mainWindow) return;
    dialog.showMessageBoxSync(mainWindow, {
      title,
      message,
      type,
    } as MessageBoxSyncOptions);
  }

  private registerIpc() {
    ipcMain.on(CloseChannel, () => this.close());

    ipcMain.on(MinimizeChannel, () => this.minimize());

    ipcMain.on(
      ShowMessageBoxChannel,
      (event, title: string, message: string, type: string) =>
        this.showMessageBox(title, message, type),
    );
  }
}
