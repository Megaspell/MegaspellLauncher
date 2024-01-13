import React, { useEffect, useState } from 'react';
import { LauncherUpdate } from '../../../common/LauncherUpdateService';

export default function LauncherUpdateLink() {
  const [availableUpdate, setAvailableUpdate] = useState<LauncherUpdate | null>(
    null,
  );

  useEffect(() => {
    window.launcherUpdateApi
      .getAvailableUpdate()
      .then((upd) => setAvailableUpdate(upd))
      .catch((e) => console.error('Launcher update API call failed', e));
  }, []);

  return availableUpdate ? (
    <a href={availableUpdate.url} target="_blank" rel="noreferrer">
      <h3>
        New launcher available! <br /> {availableUpdate.updateVersion} from{' '}
        {new Date(availableUpdate.updateDate).toLocaleDateString()}
      </h3>
    </a>
  ) : null;
}
