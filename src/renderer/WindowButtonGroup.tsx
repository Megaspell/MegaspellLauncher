import './WindowButtonGroup.css';
import minimizeIcon from '../../assets/images/minimize_FILL0_wght400_GRAD0_opsz24.svg';
import closeIcon from '../../assets/images/close_FILL0_wght400_GRAD0_opsz24.svg';

interface WindowButtonProps {
  title: string;
  icon: string;
  onClick: () => void;
}

function WindowButton(props: WindowButtonProps) {
  const { title, icon, onClick } = props;
  return (
    <button
      title={title}
      type="button"
      onClick={onClick}
      className="WindowButton"
    >
      <img height="28" width="28" alt={title} src={icon} />
    </button>
  );
}

export default function WindowButtonGroup() {
  return (
    <div className="WindowButtonGroup">
      <WindowButton
        title="Minimize"
        icon={minimizeIcon}
        onClick={() => window.appApi.minimize()}
      />
      <WindowButton
        title="Close"
        icon={closeIcon}
        onClick={() => window.appApi.close()}
      />
    </div>
  );
}
