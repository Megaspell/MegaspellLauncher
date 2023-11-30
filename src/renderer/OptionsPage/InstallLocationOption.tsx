import { useState } from 'react';
import { useCancellableEffect } from '../hooks';

import TextButton from '../Lib/TextButton';
import './InstallLocationOption.css';

export default function InstallLocationOption() {
  const [location, setLocation] = useState<string | null>(null);

  useCancellableEffect((isCancelled) => {
    window.installationApi
      .getInstallLocation()
      .then((loc) => {
        if (isCancelled()) return null;
        return setLocation(loc);
      })
      .catch((error) =>
        window.appApi.showMessageBox(
          'Error: failed to get current install location',
          error.toString(),
          'error',
        ),
      );
  }, []);

  const requestSelectNewInstallLocation = async () => {
    const newLoc = await window.appApi
      .selectDirectory(
        'Select app install directory',
        location ?? undefined,
        undefined,
      )
      .catch((error) =>
        window.appApi.showMessageBox(
          'Error: failed to select new install location',
          error.toString(),
          'error',
        ),
      );
    if (!newLoc || location === newLoc) return;

    await window.installationApi
      .setInstallLocation(newLoc)
      .then(() => setLocation(newLoc))
      .catch((error) =>
        window.appApi.showMessageBox(
          'Error: failed to set new install location',
          error.toString(),
          'error',
        ),
      );
  };

  return (
    <div className="Option">
      <div className="LocationSelector">
        <h2>Game location</h2>
        <TextButton text="Change" onClick={requestSelectNewInstallLocation} />
        <TextButton
          text="Open"
          onClick={() => {
            if (location) {
              window.appApi.openFolder(location);
            }
          }}
        />
      </div>
      {location ?? 'Not set'}
    </div>
  );
}
