import {
  ReleaseInfo,
  UpdateStage,
  UpdateStatus,
} from '../../common/GameInstallationService';

import './InstallStatus.css';

const updateStageNames = new Map<UpdateStage, string>([
  [UpdateStage.Failed, 'Failed'],
  [UpdateStage.RequestingLatestReleaseInfo, 'Getting update info'],
  [UpdateStage.AlreadyLatest, 'Latest is already installed'],
  [UpdateStage.PreCleanup, 'Cleaning current install'],
  [UpdateStage.Downloading, 'Downloading'],
  [UpdateStage.Installing, 'Installing'],
  [UpdateStage.PostCleanup, 'Cleaning temp files'],
  [UpdateStage.Complete, 'Complete'],
  [],
]);

function createUpdateStageText(updateStatus: UpdateStatus): string {
  const { stage, stageProgress } = updateStatus;
  const downloadSizeMb = Math.round(updateStatus.downloadSize / 1024 / 1024);
  const stageName = updateStageNames.get(stage) ?? 'Unknown';

  if (stage === UpdateStage.Downloading) {
    return `${stageName}: ${Math.round(
      stageProgress * downloadSizeMb,
    )}/${downloadSizeMb} MB`;
  }

  if (stage === UpdateStage.Installing) {
    return `${stageName}: ${stageProgress.toLocaleString(undefined, {
      style: 'percent',
      minimumFractionDigits: 0,
    })}`;
  }

  return stageName;
}

interface InstallStatusProps {
  installedVersion: number;
  availableUpdate: ReleaseInfo;
  updateStatus: UpdateStatus;
}

export default function InstallStatus(props: InstallStatusProps) {
  const { installedVersion, availableUpdate, updateStatus } = props;

  if (updateStatus) {
    return (
      <div className="InstallStatus">
        <h1>
          {(installedVersion ? 'Updating to v' : 'Installing v') +
            availableUpdate.tag_name}
        </h1>
        <h2>{createUpdateStageText(updateStatus)}</h2>
      </div>
    );
  }

  if (!installedVersion) {
    return (
      <div className="InstallStatus">
        <h1>
          {availableUpdate
            ? `Last version: ${availableUpdate.tag_name}`
            : 'Not installed'}
        </h1>
      </div>
    );
  }

  if (availableUpdate && installedVersion < availableUpdate.tag_name) {
    return (
      <div className="InstallStatus">
        <h1>Update available!</h1>
        <h2>New version: {availableUpdate.tag_name}</h2>
      </div>
    );
  }

  if (installedVersion) {
    return (
      <div className="InstallStatus">
        <h1>Version: {installedVersion}</h1>
      </div>
    );
  }

  return (
    <div className="InstallStatus">
      <b className="error">
        Failed to find installation files. Please try again later.
      </b>
    </div>
  );
}
