import './SocialButtonGroup.css';
import websiteIcon from '../../assets/images/captive_portal_FILL0_wght400_GRAD0_opsz24.svg';
import discordIcon from '../../assets/images/discord-mark-white.svg';

interface SocialButtonProps {
  url: string;
  icon: string;
}

function SocialButton(props: SocialButtonProps) {
  const { url, icon } = props;
  return (
    <a
      title={url}
      href={url}
      target="_blank"
      rel="noreferrer"
      className="SocialButton"
    >
      <img height="28" width="28" alt={url} src={icon} />
    </a>
  );
}

export default function SocialButtonGroup() {
  return (
    <div className="SocialButtonGroup">
      <SocialButton url="https://megaspell.net" icon={websiteIcon} />
      <SocialButton url="https://discord.gg/XfXPfz75Rv" icon={discordIcon} />
    </div>
  );
}
