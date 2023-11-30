import './SocialButtonGroup.css';
import websiteIcon from '../../assets/images/captive_portal_FILL0_wght400_GRAD0_opsz24.svg';
import discordIcon from '../../assets/images/discord-mark-white.svg';
import IconButton from './Lib/IconButton';

interface SocialButtonProps {
  url: string;
  icon: string;
}

function SocialButton(props: SocialButtonProps) {
  const { url, icon } = props;
  return (
    <IconButton
      title={url}
      onClick={() => window.open(url, '_blank')}
      icon={icon}
    />
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
