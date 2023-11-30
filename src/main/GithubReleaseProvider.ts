import path from 'path';
import fs from 'fs';
import { finished } from 'stream/promises';
import { Readable } from 'stream';
import { ReadableStream } from 'node:stream/web';
import EventEmitter from 'node:events';
import {
  AppRelease,
  DownloadedArtifact,
  LatestVersion,
  ReleaseStream,
  ReleaseStreamType,
} from '../common/ReleaseService';
import ReleaseProvider from './ReleaseProvider';
import { currentPlatform } from './util';

interface GithubReleaseAsset {
  id: string;
  url: string;
  name: string;
  content_type: string;
  size: number;
}

interface GithubRelease {
  tag_name: string;
  body?: string;
  draft: boolean;
  prerelease: boolean;
  published_at?: string;
  assets: GithubReleaseAsset[];
}

const perPageLimit = 100;

interface ProcessedRelease {
  version: string;
  publishedAt?: string;
  changelog?: string;
  /**
   * Artifact may be split in volumes, in this case this is an array in correct order.
   */
  artifact: GithubReleaseAsset | GithubReleaseAsset[];
}

interface RepoReleases {
  releases: ProcessedRelease[];
  releasesByVersion: Map<string, ProcessedRelease>;
  appReleases: AppRelease[];
  appReleasesByVersion: Map<string, AppRelease>;
}

export default class GithubReleaseProvider implements ReleaseProvider {
  private cachedReleasesByRepo: Map<string, RepoReleases> = new Map();

  private bus = new EventEmitter();

  private locked: boolean = false;

  async getRepoReleases(stream: ReleaseStream): Promise<RepoReleases> {
    const cached = this.cachedReleasesByRepo.get(stream.githubRepository);
    if (cached) return cached;

    if (this.locked) {
      await new Promise((resolve) => {
        this.bus.once('unlocked', resolve);
      });
      const cachedNow = this.cachedReleasesByRepo.get(stream.githubRepository);
      if (cachedNow) return cachedNow;
    }

    this.locked = true;

    const rawReleases: GithubRelease[] = [];
    let isLastPage = false;

    while (!isLastPage) {
      // eslint-disable-next-line no-await-in-loop
      const page = await GithubReleaseProvider.requestGithubApi<
        GithubRelease[]
      >(stream, `releases?per_page=${perPageLimit}`);
      isLastPage = !page || page.length < perPageLimit;
      if (page) {
        rawReleases.push(...page);
      }
    }

    // Order of releases can differ from order of tags
    const releases: ProcessedRelease[] = rawReleases
      .filter((r) => !r.draft && !r.prerelease)
      .flatMap((r) => {
        const artifact =
          GithubReleaseProvider.findArtifactForCurrentPlatform(r);
        if (!artifact) return [];

        return [
          {
            version: r.tag_name,
            publishedAt: r.published_at,
            changelog: r.body,
            artifact,
          } as ProcessedRelease,
        ];
      })
      .sort((a, b) => -a.version.localeCompare(b.version, 'en'));

    const appReleases: AppRelease[] = releases.map((r) => {
      const downloadSize = Array.isArray(r.artifact)
        ? r.artifact.reduce((sum, a) => sum + a.size, 0)
        : r.artifact.size;

      return {
        version: r.version,
        changelog: r.changelog,
        publishedAt: r.publishedAt,
        downloadSize,
      };
    });
    const repoReleases: RepoReleases = {
      releases,
      releasesByVersion: new Map(releases.map((r) => [r.version, r])),
      appReleases,
      appReleasesByVersion: new Map(appReleases.map((r) => [r.version, r])),
    };

    this.cachedReleasesByRepo.set(stream.githubRepository, repoReleases);

    this.locked = false;
    this.bus.emit('unlocked');
    return repoReleases;
  }

  // eslint-disable-next-line class-methods-use-this
  getLastReleases(
    stream: ReleaseStream,
    limit?: number,
  ): Promise<AppRelease[]> {
    return this.getRepoReleases(stream).then((releases) =>
      limit ? releases.appReleases.slice(0, limit) : releases.appReleases,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  getRelease(
    stream: ReleaseStream,
    version: string,
  ): Promise<AppRelease | null> {
    return this.getRepoReleases(stream).then((releases) => {
      if (version === LatestVersion) {
        return releases.appReleases.length > 0 ? releases.appReleases[0] : null;
      }
      return releases.appReleasesByVersion.get(version) ?? null;
    });
  }

  findUpdate(
    stream: ReleaseStream,
    version: string,
  ): Promise<AppRelease | null> {
    if (version === LatestVersion) {
      throw new Error(
        "Searching for updates to 'latest' version is not allowed",
      );
    }

    return this.getRepoReleases(stream).then((releases) => {
      if (releases.appReleases.length === 0) return null;
      const latest = releases.appReleases[0];
      return latest.version > version ? latest : null;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async downloadReleaseArtifact(
    stream: ReleaseStream,
    version: string,
    destination: string,
    onDownloadProgress: (bytesDownloaded: number) => void,
  ): Promise<DownloadedArtifact> {
    const release = await this.getRepoReleases(stream).then((r) =>
      r.releasesByVersion.get(version),
    );
    if (!release) {
      throw new Error(`Release not found for version ${version}`);
    }

    const artifactName = `${currentPlatform}.zip`;
    const downloadPath = path.resolve(destination, artifactName);
    if (fs.existsSync(downloadPath)) {
      await fs.promises.rm(downloadPath);
    }

    await fs.promises.mkdir(destination, { recursive: true });

    let downloaded = 0;

    const incrementDownloaded = (chunk: any) => {
      downloaded += chunk.length;
      onDownloadProgress(downloaded);
    };

    const headers = new Headers();
    headers.set('Accept', 'application/octet-stream');
    if (stream.githubToken) {
      headers.set('Authorization', `Bearer ${stream.githubToken}`);
    }

    const artifact = Array.isArray(release.artifact)
      ? release.artifact
      : [release.artifact];

    // eslint-disable-next-line no-restricted-syntax
    for await (const asset of artifact) {
      const response = await fetch(asset.url, { headers });
      const fileStream = fs.createWriteStream(downloadPath, { flags: 'a' });
      await finished(
        Readable.fromWeb(response.body as ReadableStream)
          .on('data', incrementDownloaded)
          .pipe(fileStream),
      );
    }

    return {
      version: release.version,
      artifactPath: downloadPath,
    };
  }

  private static async requestGithubApi<T>(
    stream: ReleaseStream,
    endpoint: string,
  ): Promise<T | null> {
    if (stream.type !== ReleaseStreamType.GitHub) {
      throw new Error(`unexpected stream type: ${stream.type}`);
    }

    const url = `https://api.github.com/repos/${stream.githubRepository}/${endpoint}`;

    const headers = new Headers();
    headers.set('Accept', 'application/json');
    if (stream.githubToken) {
      headers.set('Authorization', `Bearer ${stream.githubToken}`);
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error(`Request has failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  }

  /**
   * Artifact may be split in volumes, in this case returns an array in correct order.
   */
  private static findArtifactForCurrentPlatform(
    release: GithubRelease,
  ): GithubReleaseAsset | GithubReleaseAsset[] | null {
    const single = release.assets.find(
      (a) => a.name === `${currentPlatform}.zip`,
    );
    if (single) return single;

    const multiVolume = release.assets
      .filter((a) => a.name.startsWith(`${currentPlatform}.zip.`))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
    if (multiVolume && multiVolume.length > 0) {
      return multiVolume;
    }

    return null;
  }
}
