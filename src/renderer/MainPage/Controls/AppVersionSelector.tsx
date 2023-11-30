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

const lastAppVersionsToShow = 50;

export default function AppVersionSelector(props: AppVersionSelectorProps) {
  const { releaseStream } = props;

  const [selectableVersions, setSelectableVersions] = useState<AppRelease[]>(
    [],
  );

  useCancellableEffect(
    (isCancelled) => {
      console.log(
        `Requesting last ${lastAppVersionsToShow} versions from stream ${releaseStream.id}`,
      );

      window.releaseStreamApi
        .getLastReleases(releaseStream, lastAppVersionsToShow)
        .then((versions) => {
          if (isCancelled()) return null;
          return setSelectableVersions(
            [{ version: LatestVersion, downloadSize: 0 }].concat(versions),
          );
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
      <ExtendedSelect<AppRelease>
        options={selectableVersions}
        value={{
          version: current,
          downloadSize: 0,
        }}
        onChange={(option: AppRelease) => {
          onSelect(option.version);
        }}
        getOptionLabel={(it) =>
          it.version +
          (it.downloadSize > 0
            ? ` (${Math.round(it.downloadSize / 1000 / 1000)} MB)`
            : '')
        }
        getOptionValue={(s) => s.version}
        isSearchable={false}
      />
    </div>
  );
}
