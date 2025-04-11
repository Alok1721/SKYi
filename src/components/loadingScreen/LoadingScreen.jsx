// src/components/LoadingScreen.jsx
import React from 'react';
import { FiLoader } from 'react-icons/fi';
import './LoadingScreen.css';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-screen">
      <FiLoader className="loading-icon" />
      <p>{message}</p>
    </div>
  );
};

export default LoadingScreen;