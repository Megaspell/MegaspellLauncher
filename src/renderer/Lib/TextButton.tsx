import './TextButton.css';

export interface TextButtonProps {
  text: string;
  title?: string;
  disabled?: boolean;
  type?: 'submit' | 'reset' | 'button';
  onClick: () => void;
}

function TextButton(props: TextButtonProps) {
  const { text, title, disabled, type, onClick } = props;
  return (
    <button
      title={title}
      /* eslint-disable-next-line react/button-has-type */
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="TextButton"
    >
      {text}
    </button>
  );
}

TextButton.defaultProps = {
  title: null,
  disabled: false,
  type: 'button',
};

export default TextButton;
