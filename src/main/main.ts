/* eslint global-require: off, promise/always-return: off, @typescript-eslint/no-unused-vars: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell } from 'electron';
import { resolveHtmlPath } from './util';
import InstallationServiceImpl from './InstallationServiceImpl';
import StoreServiceImpl from './StoreServiceImpl';
import LaunchServiceImpl from './LaunchServiceImpl';
import AppServiceImpl from './AppServiceImpl';
import ReleaseServiceImpl from './ReleaseServiceImpl';
import LauncherUpdateServiceImpl from './LauncherUpdateServiceImpl';

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const launcherRepo = 'Megaspell/MegaspellLauncher';
const launcherUpdateService = new LauncherUpdateServiceImpl(launcherRepo);

const appService = new AppServiceImpl(() => mainWindow);
const storeService = new StoreServiceImpl();
const releaseStreamService = new ReleaseServiceImpl(storeService);
const installationService = new InstallationServiceImpl(
  storeService,
  releaseStreamService,
);
const gameLaunchService = new LaunchServiceImpl(
  storeService,
  releaseStreamService,
  installationService,
);

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

function showUpdateMessage() {
  launcherUpdateService
    .getAvailableUpdate()
    .then((upd) => {
      if (upd == null) return null;

      const shownVersion = storeService.get('updateMessageShownVersion');
      if (shownVersion === upd.updateVersion) return null;
      storeService.set('updateMessageShownVersion', upd.updateVersion);

      const dateStr = new Date(upd.updateDate).toLocaleDateString();
      appService.showMessageBox(
        'Launcher update',
        `New update for launcher available!
Current version: ${upd.currentVersion}
New version: ${upd.updateVersion} released on ${dateStr}
Link: ${upd.url}`,
        'info',
      );
      return null;
    })
    .catch(() => null);
}

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 576,
    show: true,
    frame: false,
    resizable: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.removeMenu();

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  showUpdateMessage();
};

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
