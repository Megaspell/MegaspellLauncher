import './IconButton.css';

export interface IconButtonProps {
  title: string;
  icon: string;
  iconSize?: number;
  disabled?: boolean;
  onClick: () => void;
}

function IconButton(props: IconButtonProps) {
  const { title, icon, iconSize, disabled, onClick } = props;
  return (
    <button
      title={title}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="IconButton"
    >
      <img height={iconSize} width={iconSize} alt={title} src={icon} />
    </button>
  );
}

IconButton.defaultProps = {
  disabled: false,
  iconSize: 28,
};

export default IconButton;
