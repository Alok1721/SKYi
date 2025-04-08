import React, { useState, useEffect } from 'react';
import { THEMES, getCurrentTheme, setTheme } from '../../utils/themeUtils';
import { FiSun, FiMoon } from 'react-icons/fi';
import './UserSettings.css';

const UserSettings = () => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  useEffect(() => {
    setTheme(currentTheme);
    // Update root background color
    document.documentElement.style.backgroundColor = currentTheme === THEMES.DARK ? '#1a1a1a' : '#ffffff';
  }, [currentTheme]);

  const handleThemeToggle = () => {
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setCurrentTheme(newTheme);
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
        <h1>Settings</h1>
        <div className="settings-section">
          <h2>Appearance</h2>
          <div className="theme-toggle-container">
            <div className="theme-info">
              <span className="theme-icon">
                {currentTheme === THEMES.DARK ? <FiMoon /> : <FiSun />}
              </span>
              <div className="theme-text">
                <span className="theme-label">
                  {currentTheme === THEMES.DARK ? 'Dark Mode' : 'Light Mode'}
                </span>
                <p className="theme-description">
                  Switch between light and dark theme for the entire application
                </p>
              </div>
            </div>
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
    </div>
  );
};

export default UserSettings; 