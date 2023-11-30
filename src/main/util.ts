import { URL } from 'url';
import path from 'path';
import { app } from 'electron';
import TargetPlatform from '../common/TargetPlatform';

export const appDir: string =
  process.env.NODE_ENV === 'development'
    ? app.getAppPath()
    : path.dirname(app.getPath('exe'));

export const currentPlatform: TargetPlatform = (() => {
  switch (process.platform) {
    case 'win32':
      return TargetPlatform.PlayerWindows64;
    case 'linux':
      return TargetPlatform.PlayerLinux64;
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
