import { useState } from 'react';
import {
  AppRelease,
  LatestVersion,
  ReleaseStream,
} from '../../../common/ReleaseService';
import ExtendedSelect from '../../Lib/ExtendedSelect';
import { useCancellableEffect } from '../../hooks';
import './SelectorControl.css';

export interface AppVersionSelectorProps {
  releaseStream: ReleaseStream;
  current: string;
  onSelect: (version: string) => void;
}

export interface AppReleaseOption {
  version: string;
  downloadSize: number;
  installed: boolean;
}

const lastAppVersionsToShow = 50;

export default function AppVersionSelector(props: AppVersionSelectorProps) {
  const { releaseStream } = props;

  const [selectableVersions, setSelectableVersions] = useState<
    AppReleaseOption[]
  >([]);

  useCancellableEffect(
    (isCancelled) => {
      console.log(
        `Requesting last ${lastAppVersionsToShow} versions from stream ${releaseStream.id}`,
      );

      window.releaseStreamApi
        .getLastReleases(releaseStream, lastAppVersionsToShow)
        .then((releases) =>
          [{ version: LatestVersion, downloadSize: 0 }].concat(releases),
        )
        .then((releases) => {
          return window.installationApi
            .areVersionsInstalled(
              releaseStream.id,
              releases.map((release) => release.version),
            )
            .then((installStatuses) => {
              return releases.map((release, index) => {
                return {
                  version: release.version,
                  downloadSize: release.downloadSize,
                  installed: installStatuses[index].installed,
                } as AppReleaseOption;
              });
            });
        })
        .then((versions) => {
          if (isCancelled()) return null;
          return setSelectableVersions(versions);
        })
        .catch((error) =>
          window.appApi.showMessageBox(
            'Error',
            `Unable to get last ${lastAppVersionsToShow} app versions from stream ${releaseStream.id}: ${error}`,
            'error',
          ),
        );
    },
    [releaseStream.id],
  );

  const { current, onSelect } = props;

  return (
    <div className="SelectorControl">
      <h2>Version</h2>
      <ExtendedSelect<AppReleaseOption>
        options={selectableVersions}
        value={
          selectableVersions.find((option) => option.version === current) ??
          ({
            version: current,
            downloadSize: 0,
            installed: false,
          } as AppReleaseOption)
        }
        onChange={(option: AppRelease) => {
          onSelect(option.version);
        }}
        getOptionLabel={(it) => {
          if (it.version === LatestVersion) {
            return 'Latest version';
          }
          if (it.installed) {
            return `${it.version} (installed)`;
          }
          if (it.downloadSize > 0) {
            return `${it.version} (${Math.round(
              it.downloadSize / 1000 / 1000,
            )} MB)`;
          }
          return it.version;
        }}
        getOptionValue={(s) => s.version}
        isSearchable={false}
      />
    </div>
  );
}
