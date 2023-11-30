import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  MessageBoxSyncOptions,
} from 'electron';
import fs from 'fs';
import { spawn } from 'child_process';
import AppService, {
  CloseChannel,
  MinimizeChannel,
  OpenFolderChannel,
  SelectDirectoryChannel,
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

  // eslint-disable-next-line class-methods-use-this
  selectDirectory(
    title: string,
    path: string | undefined,
    message: string | undefined,
  ): Promise<string | null> {
    return dialog
      .showOpenDialog({
        title,
        defaultPath: path,
        properties: ['openDirectory'],
        message,
      })
      .then((result) => {
        if (result.canceled) {
          return path ?? null;
        }
        return result.filePaths.length > 0 ? result.filePaths[0] : null;
      });
  }

  // eslint-disable-next-line class-methods-use-this
  openFolder(path: string) {
    // Very important to check if whenever this is actually a directory!
    if (!fs.existsSync(path) || !fs.lstatSync(path).isDirectory()) {
      throw new Error(`Directory at ${path} not found`);
    }

    const explorer = (() => {
      switch (process.platform) {
        case 'win32':
          return 'explorer';
        case 'linux':
          return 'xdg-open';
        case 'darwin':
          return 'open';
        default:
          throw new Error('Unsupported platform');
      }
    })();

    spawn(explorer, [path], { detached: true }).unref();
  }

  private registerIpc() {
    ipcMain.on(CloseChannel, () => this.close());

    ipcMain.on(MinimizeChannel, () => this.minimize());

    ipcMain.on(
      ShowMessageBoxChannel,
      (event, title: string, message: string, type: string) =>
        this.showMessageBox(title, message, type),
    );

    ipcMain.handle(
      SelectDirectoryChannel,
      (
        event,
        title: string,
        path: string | undefined,
        message: string | undefined,
      ) => this.selectDirectory(title, path, message),
    );

    ipcMain.on(OpenFolderChannel, (event, path: string) =>
      this.openFolder(path),
    );
  }
}
