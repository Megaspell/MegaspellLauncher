// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

import AppService, {
  CloseChannel,
  MinimizeChannel,
  OpenFolderChannel,
  SelectDirectoryChannel,
  ShowMessageBoxChannel,
} from '../common/AppService';
import InstallationService, {
  AreVersionsInstalledChannel,
  GetInstallLocationChannel,
  GetVersionInstallDirChannel,
  InstallOrUpdateChannel,
  InstallProgress,
  IsVersionInstalledChannel,
  SetInstallLocationChannel,
} from '../common/InstallationService';
import LaunchService, {
  GetCurrentAppVersionChannel,
  GetCurrentReleaseStreamChannel,
  GetGraphicsApiChannel,
  GraphicsApi,
  LaunchAppChannel,
  SetCurrentAppVersionChannel,
  SetCurrentReleaseStreamChannel,
  SetGraphicsApiChannel,
} from '../common/LaunchService';
import ReleaseService, {
  AddReleaseStreamChannel,
  FindUpdateChannel,
  GetLastReleasesChannel,
  GetReleaseChannel,
  GetReleaseStreamsChannel,
  ReleaseStream,
  RemoveReleaseStreamChannel,
} from '../common/ReleaseService';

const appApi: AppService = {
  minimize: () => ipcRenderer.send(MinimizeChannel),

  close: () => ipcRenderer.send(CloseChannel),

  showMessageBox: (title: string, message: string, type: string) =>
    ipcRenderer.send(ShowMessageBoxChannel, title, message, type),

  selectDirectory: (
    title: string,
    path: string | undefined,
    message: string | undefined,
  ) => ipcRenderer.invoke(SelectDirectoryChannel, title, path, message),

  openFolder: (path: string) => ipcRenderer.send(OpenFolderChannel, path),
};

const releaseStreamApi: ReleaseService = {
  getStreams: () => ipcRenderer.invoke(GetReleaseStreamsChannel),

  addStream: (stream: ReleaseStream) =>
    ipcRenderer.invoke(AddReleaseStreamChannel, stream),

  removeStream: (stream: ReleaseStream) =>
    ipcRenderer.invoke(RemoveReleaseStreamChannel, stream),

  getLastReleases: (stream: ReleaseStream) =>
    ipcRenderer.invoke(GetLastReleasesChannel, stream),

  getRelease: (stream: ReleaseStream, version: string) =>
    ipcRenderer.invoke(GetReleaseChannel, stream, version),

  findUpdate: (stream: ReleaseStream, version: string) =>
    ipcRenderer.invoke(FindUpdateChannel, stream, version),

  downloadReleaseArtifact: () => {
    return Promise.reject(new Error('not supported in renderer'));
  },
};

const installationApi: InstallationService = {
  getInstallLocation: () => ipcRenderer.invoke(GetInstallLocationChannel),

  setInstallLocation: (location: string) =>
    ipcRenderer.invoke(SetInstallLocationChannel, location),

  getVersionInstallDir: (streamId: string, version: string) =>
    ipcRenderer.invoke(GetVersionInstallDirChannel, streamId, version),

  isVersionInstalled: (streamId: string, version: string) =>
    ipcRenderer.invoke(IsVersionInstalledChannel, streamId, version),

  areVersionsInstalled: (streamId: string, versions: string[]) =>
    ipcRenderer.invoke(AreVersionsInstalledChannel, streamId, versions),

  installOrUpdate: async (
    streamId: string,
    version: string,
    force: boolean,
    onStatusChange: (status: InstallProgress) => void,
  ) => {
    const listener = (event: IpcRendererEvent, status: InstallProgress) => {
      onStatusChange(status);
    };
    ipcRenderer.on(InstallOrUpdateChannel, listener);
    // eslint-disable-next-line promise/catch-or-return
    await ipcRenderer.invoke(InstallOrUpdateChannel, streamId, version, force);
  },
};

const launchApi: LaunchService = {
  getCurrentReleaseStream: () =>
    ipcRenderer.invoke(GetCurrentReleaseStreamChannel),

  setCurrentReleaseStream: (streamId: string | null) =>
    ipcRenderer.invoke(SetCurrentReleaseStreamChannel, streamId),

  getCurrentAppVersion: () => ipcRenderer.invoke(GetCurrentAppVersionChannel),

  setCurrentAppVersion: (version: string | null) =>
    ipcRenderer.invoke(SetCurrentAppVersionChannel, version),

  getGraphicsApi: () => ipcRenderer.invoke(GetGraphicsApiChannel),
  setGraphicsApi: (api: GraphicsApi | null) =>
    ipcRenderer.invoke(SetGraphicsApiChannel, api),
  launchApp: () => ipcRenderer.invoke(LaunchAppChannel),
};

contextBridge.exposeInMainWorld('appApi', appApi);
contextBridge.exposeInMainWorld('releaseStreamApi', releaseStreamApi);
contextBridge.exposeInMainWorld('installationApi', installationApi);
contextBridge.exposeInMainWorld('launchApi', launchApi);
