import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import './App.css';
import React from 'react';
import { MainRoute, OptionsRoute } from './routes';
import MainPage from './MainPage/MainPage';
import OptionsPage from './OptionsPage/OptionsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path={MainRoute} element={<MainPage />} />
        <Route path={OptionsRoute} element={<OptionsPage />} />
      </Routes>
    </Router>
  );
}
