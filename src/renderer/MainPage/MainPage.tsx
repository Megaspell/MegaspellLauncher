import { useState } from 'react';

import logoImage from 'assets/Megaspell_Logo.png';
import Blog from './Blog/Blog';
import Page from '../Page';
import {
  AppRelease,
  DefaultReleaseStream,
  LatestVersion,
  ReleaseStream,
} from '../../common/ReleaseService';
import {
  InstallationStatus,
  InstallProgress,
} from '../../common/InstallationService';
import PlayButton from './Controls/PlayButton';

import '../Page.css';
import './MainPage.css';
import InstallStatus from './Controls/InstallStatus';
import ReleaseStreamSelector from './Controls/ReleaseStreamSelector';
import AppVersionSelector from './Controls/AppVersionSelector';
import { useCancellableEffect } from '../hooks';

export default function MainPage() {
  const [currentReleaseStream, setCurrentReleaseStream] =
    useState<ReleaseStream>(DefaultReleaseStream);

  const [currentVersion, setCurrentVersion] = useState<string>(LatestVersion);
  const [installationStatus, setInstallationStatus] =
    useState<InstallationStatus>({ installed: false });
  const [availableUpdate, setAvailableUpdate] = useState<AppRelease | null>(
    null,
  );
  const [installProgress, setInstallProgress] =
    useState<InstallProgress | null>(null);
  const [gameLaunched, setGameLaunched] = useState<boolean>(false);

  useCancellableEffect(
    (isCancelled) => {
      console.log('Requesting current release stream');

      window.launchApi
        .getCurrentReleaseStream()
        .then((stream) => {
          if (isCancelled()) return null;
          console.log(`Received current release stream`, stream.id);
          return setCurrentReleaseStream(stream);
        })
        .catch((error) =>
          window.appApi.showMessageBox(
            'Error: failed to get current release stream',
            error.toString(),
            'error',
          ),
        );
    },
    [currentReleaseStream.id],
  );

  useCancellableEffect((isCancelled) => {
    console.log('Requesting current app version');

    window.launchApi
      .getCurrentAppVersion()
      .then((version) => {
        if (isCancelled()) return null;
        console.log(`Received current app version`, version);
        return setCurrentVersion(version);
      })
      .catch((error) =>
        window.appApi.showMessageBox(
          'Error: failed to get current app version',
          error.toString(),
          'error',
        ),
      );
  }, []);

  useCancellableEffect(
    (isCancelled) => {
      console.log(
        `Requesting current installation status of ${currentVersion} from stream ${currentReleaseStream.id}`,
      );

      window.installationApi
        .isVersionInstalled(currentReleaseStream.id, currentVersion)
        .then((installed) => {
          if (isCancelled()) return null;
          console.log(`Received current installation status`, installed);
          return setInstallationStatus(installed);
        })
        .catch((error) =>
          window.appApi.showMessageBox(
            'Error: failed to get installation status',
            error.toString(),
            'error',
          ),
        );
    },
    [currentReleaseStream.id, currentVersion],
  );

  useCancellableEffect(
    (isCancelled) => {
      if (currentVersion === LatestVersion && installationStatus.realVersion) {
        console.log(
          `Requesting available updates for ${installationStatus.realVersion} from stream ${currentReleaseStream.id}`,
        );

        window.releaseStreamApi
          .findUpdate(currentReleaseStream, installationStatus.realVersion)
          .then((update) => {
            if (isCancelled()) return null;
            console.log(`Received available update response`, update);
            return setAvailableUpdate(update);
          })
          .catch((error) =>
            window.appApi.showMessageBox(
              'Error: failed to check for available updates',
              error.toString(),
              'error',
            ),
          );
        return;
      }

      if (installationStatus.installed) {
        console.log(
          `Skipping checking available install for ${currentVersion}`,
        );
        setAvailableUpdate(null);
        return;
      }

      console.log(
        `Requesting available install for ${currentVersion} from stream ${currentReleaseStream.id}`,
      );

      window.releaseStreamApi
        .getRelease(currentReleaseStream, currentVersion)
        .then((release) => {
          if (isCancelled()) return null;
          console.log(`Received available install response`, release);
          return setAvailableUpdate(release);
        })
        .catch((error) =>
          window.appApi.showMessageBox(
            'Error: failed to check available install',
            error.toString(),
            'error',
          ),
        );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      currentReleaseStream.id,
      currentVersion,
      installationStatus.installed,
      installationStatus.realVersion,
    ],
  );

  const requestSetCurrentReleaseStream = (stream: ReleaseStream | null) => {
    const toSet = stream ? stream.id : DefaultReleaseStream.id;
    console.log(
      `Requesting set current release stream: ${currentReleaseStream.id} -> ${toSet}`,
    );
    if (toSet === currentReleaseStream.id) return;

    window.launchApi
      .setCurrentReleaseStream(toSet)
      .then((success: boolean) =>
        success
          ? setCurrentReleaseStream(stream ?? DefaultReleaseStream)
          : undefined,
      )
      .catch((error) => {
        window.appApi.showMessageBox(
          'Error: failed to change current release stream',
          error.toString(),
          'error',
        );
      });
  };

  const requestSetCurrentVersion = (version: string | null) => {
    const toSet = version || LatestVersion;
    console.log(
      `Requesting set current version: ${currentVersion} -> ${toSet}`,
    );
    if (toSet === currentVersion) return;

    window.launchApi
      .setCurrentAppVersion(toSet)
      .then((success: boolean) =>
        success ? setCurrentVersion(toSet) : undefined,
      )
      .catch((error) => {
        window.appApi.showMessageBox(
          'Error: failed to change current version',
          error.toString(),
          'error',
        );
      });
  };

  const playButtonText = (() => {
    if (gameLaunched) {
      return 'LAUNCHED';
    }
    if (!installationStatus.installed) {
      return 'INSTALL';
    }
    if (currentVersion !== LatestVersion && availableUpdate) {
      return 'UPDATE';
    }
    return 'PLAY';
  })();

  return (
    <Page>
      <div className="PageContainer">
        <div className="PageLeft">
          <img alt="" height="64px" src={logoImage} />
          <div className="MainPageControls">
            <ReleaseStreamSelector
              current={currentReleaseStream}
              onSelect={requestSetCurrentReleaseStream}
            />
            <AppVersionSelector
              releaseStream={currentReleaseStream}
              current={currentVersion}
              onSelect={requestSetCurrentVersion}
            />
            <InstallStatus
              installationStatus={installationStatus}
              availableUpdate={availableUpdate}
              updateStatus={installProgress}
            />
            <PlayButton
              text={playButtonText}
              disabled={
                (!installationStatus.installed && !availableUpdate) ||
                !!installProgress ||
                gameLaunched
              }
              onClick={() => {
                (async () => {
                  if (availableUpdate) {
                    await window.installationApi.installOrUpdate(
                      currentReleaseStream.id,
                      currentVersion,
                      false,
                      (status) => {
                        setInstallProgress(status);
                      },
                    );
                    setInstallProgress(null);
                    // eslint-disable-next-line no-restricted-globals
                    location.reload();
                    return;
                  }
                  if (installationStatus) {
                    setGameLaunched(true);
                    await window.launchApi.launchApp();
                    setGameLaunched(false);
                  }
                })();
              }}
            />
          </div>
        </div>
        <div className="PageRight">
          <Blog releaseStream={currentReleaseStream} />
        </div>
      </div>
    </Page>
  );
}
