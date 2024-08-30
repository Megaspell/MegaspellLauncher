import { useEffect, useState } from 'react';
import ExtendedSelect from '../../Lib/ExtendedSelect';
import { GraphicsApi } from '../../../common/LaunchService';
import './SelectorControl.css';

interface Option {
  api: GraphicsApi | null;
}

const options: Option[] = [
  { api: null },
  { api: GraphicsApi.Vulkan },
  { api: GraphicsApi.DX12 },
  { api: GraphicsApi.DX11 },
];

export default function GraphicsApiSelector() {
  const [current, setCurrent] = useState<GraphicsApi | null>(null);

  useEffect(() => {
    window.launchApi
      .getGraphicsApi()
      .then((api) => setCurrent(api))
      .catch((error) => {
        window.appApi.showMessageBox(
          'Error: failed to get launch graphics API',
          error.toString(),
          'error',
        );
      });
  }, []);

  const requestSetGraphicsApi = (api: GraphicsApi | null) => {
    window.launchApi
      .setGraphicsApi(api)
      .then(() => setCurrent(api))
      .catch((error: Error) => {
        window.appApi.showMessageBox(
          'Error: failed to set graphics API for app launch',
          error.toString(),
          'error',
        );
      });
  };

  return (
    <div className="SelectorControl">
      <h2>Graphics API</h2>
      <ExtendedSelect<Option>
        options={options}
        value={{ api: current }}
        onChange={(option: Option) => {
          requestSetGraphicsApi(option.api);
        }}
        getOptionLabel={(o) => o.api ?? 'Auto'}
        getOptionValue={(s) => s.api ?? 'auto'}
        isSearchable={false}
      />
    </div>
  );
}
