import { URL } from 'url';
import path from 'path';
import { app } from 'electron';
import GameTarget from '../common/GameTarget';

export const appDir: string =
  process.env.NODE_ENV === 'development'
    ? app.getAppPath()
    : path.dirname(app.getPath('exe'));

export const installPath: string = path.resolve(
  app.getPath('userData'),
  'game',
);

export const currentGameTarget: GameTarget = (() => {
  switch (process.platform) {
    case 'win32':
      return GameTarget.PlayerWindows64;
    case 'linux':
      return GameTarget.PlayerLinux64;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
})();

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}
