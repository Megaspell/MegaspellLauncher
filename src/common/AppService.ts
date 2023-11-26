export const MinimizeChannel = 'appApi.minimize';
export const CloseChannel = 'appApi.close';
export const ShowMessageBoxChannel = 'appApi.showMessageBox';

export default interface AppService {
  minimize();

  close();

  showMessageBox(title: string, message: string, type: string);
}
