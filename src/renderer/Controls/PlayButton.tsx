import './PlayButton.css';

export interface PlayButtonProps {
  text: string;
  disabled: boolean;
  onClick?: () => void;
}

function PlayButton(props: PlayButtonProps) {
  const { text, disabled, onClick } = props;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="PlayButton"
    >
      <h1>{text}</h1>
    </button>
  );
}

PlayButton.defaultProps = {
  onClick: () => {},
};

export default PlayButton;
