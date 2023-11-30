export const MinimizeChannel = 'appApi.minimize';
export const CloseChannel = 'appApi.close';
export const ShowMessageBoxChannel = 'appApi.showMessageBox';
export const SelectDirectoryChannel = 'appApi.selectDirectory';
export const OpenFolderChannel = 'appApi.openFolder';

export default interface AppService {
  minimize(): void;

  close(): void;

  showMessageBox(title: string, message: string, type: string): void;

  selectDirectory(
    title: string,
    path: string | undefined,
    message: string | undefined,
  ): Promise<string | null>;

  openFolder(path: string): void;
}
