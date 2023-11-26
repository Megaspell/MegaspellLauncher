import { useEffect, useState } from 'react';

import {
  ReleaseInfo,
  UpdateStatus,
} from '../../common/GameInstallationService';

import './Controls.css';

import PlayButton from './PlayButton';
import InstallStatus from './InstallStatus';

export default function Controls() {
  const [installedVersion, setInstalledVersion] = useState<number>(null);
  const [availableUpdate, setAvailableUpdate] = useState<ReleaseInfo>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(null);
  const [gameLaunched, setGameLaunched] = useState<boolean>(false);

  async function requestAvailableUpdate() {
    const response = await window.installationApi.checkAvailableUpdate();
    setInstalledVersion(response.currentVersion);
    if (response.error) {
      window.appApi.showMessageBox(
        'Error',
        `Failed to check for updates:\n${response.error}`,
        'error',
      );
    } else if (response.available) {
      setAvailableUpdate(response.releaseInfo as ReleaseInfo);
    } else {
      setAvailableUpdate(null);
    }
  }

  useEffect(() => {
    requestAvailableUpdate();
  }, []);

  const playButtonText: string = (() => {
    if (gameLaunched) {
      return 'LAUNCHED';
    }
    if (!installedVersion) {
      return 'INSTALL';
    }
    return 'PLAY';
  })();

  return (
    <div className="Controls">
      <InstallStatus
        installedVersion={installedVersion}
        availableUpdate={availableUpdate}
        updateStatus={updateStatus}
      />
      <PlayButton
        text={playButtonText}
        disabled={
          (!installedVersion && !availableUpdate) ||
          !!updateStatus ||
          gameLaunched
        }
        onClick={() => {
          (async () => {
            if (availableUpdate) {
              await window.installationApi.downloadOrUpdate(false, (status) => {
                setUpdateStatus(status);
              });
              await requestAvailableUpdate();
              setUpdateStatus(null);
              return;
            }
            if (installedVersion) {
              setGameLaunched(true);
              await window.launchApi.launchGame();
              setGameLaunched(false);
            }
          })();
        }}
      />
    </div>
  );
}
