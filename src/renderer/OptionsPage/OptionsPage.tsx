import Page from '../Page';

import './OptionsPage.css';
import ReleaseStreamOption from './ReleaseStreamsOption';
import InstallLocationOption from './InstallLocationOption';

export default function OptionsPage() {
  return (
    <Page>
      <div className="OptionsPage">
        <h1>Options</h1>
        <ReleaseStreamOption />
        <InstallLocationOption />
      </div>
    </Page>
  );
}
