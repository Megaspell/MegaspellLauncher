import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import Blog from './Blog/Blog';
import WindowButtonGroup from './WindowButtonGroup';
import SocialButtonGroup from './SocialButtonGroup';
import Controls from './Controls/Controls';

import './App.css';
import logoImage from '../../assets/Megaspell_Logo.png';

function Content() {
  return (
    <div className="Content">
      <div className="ContentLeft">
        <img alt="" height="64px" src={logoImage} />
        <Controls />
      </div>
      <div className="ContentRight">
        <Blog />
      </div>
      <WindowButtonGroup />
      <SocialButtonGroup />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Content />} />
      </Routes>
    </Router>
  );
}
