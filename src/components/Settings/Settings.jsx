import React, { useState, useEffect } from 'react';
import { THEMES, getCurrentTheme, setTheme } from '../../utils/themeUtils';
import './Settings.css';

const Settings = () => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeToggle = () => {
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setCurrentTheme(newTheme);
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <div className="settings-section card">
        <h2>Appearance</h2>
        <div className="theme-toggle-container">
          <span>Dark Mode</span>
          <label className="theme-switch">
            <input
              type="checkbox"
              checked={currentTheme === THEMES.DARK}
              onChange={handleThemeToggle}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings; 