import {
  InstallStage,
  InstallProgress,
  InstallationStatus,
} from '../../../common/InstallationService';

import './InstallStatus.css';
import { AppRelease } from '../../../common/ReleaseService';

const updateStageNames = new Map<InstallStage, string>([
  [InstallStage.Failed, 'Failed'],
  [InstallStage.RequestingLatestReleaseInfo, 'Getting update info'],
  [InstallStage.AlreadyLatest, 'Latest is already installed'],
  [InstallStage.PreCleanup, 'Cleaning current install'],
  [InstallStage.Downloading, 'Downloading'],
  [InstallStage.Installing, 'Installing'],
  [InstallStage.PostCleanup, 'Cleaning temp files'],
  [InstallStage.Complete, 'Complete'],
]);

function createUpdateStageText(updateStatus: InstallProgress): string {
  const { stage, stageProgress } = updateStatus;
  const downloadSizeMb = Math.round(updateStatus.downloadSize / 1024 / 1024);
  const stageName = updateStageNames.get(stage) ?? 'Unknown';

  if (stage === InstallStage.Downloading) {
    return `${stageName}: ${Math.round(
      stageProgress * downloadSizeMb,
    )}/${downloadSizeMb} MB`;
  }

  if (stage === InstallStage.Installing) {
    return `${stageName}: ${stageProgress.toLocaleString(undefined, {
      style: 'percent',
      minimumFractionDigits: 0,
    })}`;
  }

  return stageName;
}

interface InstallStatusProps {
  installationStatus: InstallationStatus;
  availableUpdate: AppRelease | null;
  updateStatus: InstallProgress | null;
}

export default function InstallStatus(props: InstallStatusProps) {
  const { installationStatus, availableUpdate, updateStatus } = props;

  if (updateStatus) {
    return (
      <div className="InstallStatus">
        <h1>
          {(installationStatus.installed ? 'Updating to v' : 'Installing v') +
            updateStatus.version}
        </h1>
        <h2>{createUpdateStageText(updateStatus)}</h2>
      </div>
    );
  }

  if (availableUpdate && !installationStatus.installed) {
    return (
      <div className="InstallStatus">
        <h1>{`Version: ${availableUpdate.version}`}</h1>
      </div>
    );
  }

  if (availableUpdate) {
    return (
      <div className="InstallStatus">
        <h1>Update available!</h1>
        <h2>Current version: {availableUpdate.version}</h2>
        <h2>New version: {availableUpdate.version}</h2>
      </div>
    );
  }

  if (installationStatus.installed) {
    return (
      <div className="InstallStatus">
        <h1>Version: {installationStatus.realVersion}</h1>
      </div>
    );
  }

  return <div className="InstallStatus">Loading...</div>;
}
