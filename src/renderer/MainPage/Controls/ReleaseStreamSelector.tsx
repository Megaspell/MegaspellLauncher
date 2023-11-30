import { useEffect, useState } from 'react';
import {
  DefaultReleaseStream,
  ReleaseStream,
} from '../../../common/ReleaseService';
import './ReleaseStreamSelector.css';
import ExtendedSelect from '../../Lib/ExtendedSelect';

export interface ReleaseStreamSelectorProps {
  current: ReleaseStream;
  onSelect: (stream: ReleaseStream) => void;
}

export default function ReleaseStreamSelector(
  props: ReleaseStreamSelectorProps,
) {
  const [streams, setStreams] = useState([DefaultReleaseStream]);

  useEffect(() => {
    window.releaseStreamApi
      .getStreams()
      .then((s) => setStreams(s))
      .catch((error) => {
        window.appApi.showMessageBox(
          'Error: failed to get release streams',
          error.toString(),
          'error',
        );
      });
  }, []);

  const { current, onSelect } = props;

  return (
    <div className="ReleaseStreamSelector">
      <h2>Release stream</h2>
      <ExtendedSelect<ReleaseStream>
        options={streams}
        value={current}
        onChange={(option: ReleaseStream) => {
          onSelect(option);
        }}
        getOptionLabel={(s) => s.id}
        getOptionValue={(s) => s.id}
        isSearchable={false}
      />
    </div>
  );
}
