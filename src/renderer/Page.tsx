import { ReactNode } from 'react';
import WindowButtonGroup from './WindowButtonGroup';
import SocialButtonGroup from './SocialButtonGroup';
import './Page.css';

export interface ContentProps {
  children?: ReactNode;
}

function Page(props: ContentProps) {
  const { children } = props;
  return (
    <div className="Page">
      <a style={{ position: 'absolute', left: '-1000px', opacity: 0 }} href="/">
        Hidden tab indexer button
      </a>
      {children}
      <WindowButtonGroup />
      <SocialButtonGroup />
    </div>
  );
}

Page.defaultProps = {
  children: undefined,
};

export default Page;
