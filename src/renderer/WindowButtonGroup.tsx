import './WindowButtonGroup.css';
import { useLocation, useNavigate } from 'react-router-dom';
import optionsIcon from 'assets/images/settings_FILL0_wght400_GRAD0_opsz24.svg';
import backIcon from 'assets/images/arrow_back_FILL0_wght400_GRAD0_opsz24.svg';
import minimizeIcon from 'assets/images/minimize_FILL0_wght400_GRAD0_opsz24.svg';
import closeIcon from 'assets/images/close_FILL0_wght400_GRAD0_opsz24.svg';
import { OptionsRoute } from './routes';
import IconButton, { IconButtonProps } from './Lib/IconButton';

function OptionsButton(props: IconButtonProps) {
  const location = useLocation();

  if (location.pathname === OptionsRoute) {
    return null;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <IconButton {...props} />;
}

function BackButton(props: IconButtonProps) {
  const location = useLocation();

  if (location.key === 'default') {
    return null;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <IconButton {...props} />;
}

export default function WindowButtonGroup() {
  const navigate = useNavigate();

  return (
    <div className="WindowButtonGroup">
      <OptionsButton
        title="Options"
        icon={optionsIcon}
        onClick={() => navigate('/options')}
      />
      <BackButton
        title="Go back"
        icon={backIcon}
        onClick={() => navigate(-1)}
      />
      <IconButton
        title="Minimize"
        icon={minimizeIcon}
        onClick={() => window.appApi.minimize()}
      />
      <IconButton
        title="Close"
        icon={closeIcon}
        onClick={() => window.appApi.close()}
      />
    </div>
  );
}
