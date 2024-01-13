import { app, ipcMain } from 'electron';
import LauncherUpdateService, {
  GetAvailableUpdateChannel,
  LauncherUpdate,
} from '../common/LauncherUpdateService';

interface GithubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  html_url: string;
  published_at?: string;
}

export default class LauncherUpdateServiceImpl
  implements LauncherUpdateService
{
  private readonly updateUrl;

  private cachedAvailableUpdate: LauncherUpdate | null | undefined;

  constructor(launcherRepo) {
    this.updateUrl = `https://api.github.com/repos/${launcherRepo}/releases/latest`;
    this.registerIpc();
  }

  async getAvailableUpdate(): Promise<LauncherUpdate | null> {
    if (process.env.NODE_ENV !== 'production') {
      // return null;
    }

    if (this.cachedAvailableUpdate !== undefined) {
      return this.cachedAvailableUpdate;
    }

    this.cachedAvailableUpdate = await this.requestLatestUpdate();
    return this.cachedAvailableUpdate;
  }

  private async requestLatestUpdate(): Promise<LauncherUpdate | null> {
    const currentVersion = app.getVersion();
    const latestUpdate = await this.doGithubRequest().catch((e) => {
      console.error('Failed to get latest launcher update', e);
      return null;
    });

    if (!latestUpdate) {
      return null;
    }

    const latestVersion = latestUpdate.tag_name.replace('v', '');

    if (latestVersion <= currentVersion) {
      console.log(
        `No launcher update available, current ${currentVersion} vs latest ${latestVersion}`,
      );
      return null;
    }
    if (latestUpdate.prerelease || latestUpdate.draft) {
      console.error(
        `Unexpected: latest version ${latestVersion} is prerelease or draft`,
      );
      return null;
    }

    console.log(
      `Launcher update available: current is ${currentVersion},
      new is ${latestVersion} published at ${latestUpdate.published_at}`,
    );

    return {
      currentVersion,
      updateVersion: latestVersion,
      updateDate: latestUpdate.published_at ?? new Date().toISOString(),
      url: latestUpdate.html_url,
    };
  }

  private async doGithubRequest(): Promise<GithubRelease | null> {
    const headers = new Headers();
    headers.set('Accept', 'application/json');
    const res = await fetch(this.updateUrl, { headers });
    if (!res.ok) {
      throw new Error(`Request has failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as GithubRelease;
  }

  private registerIpc() {
    ipcMain.handle(GetAvailableUpdateChannel, () => this.getAvailableUpdate());
  }
}
