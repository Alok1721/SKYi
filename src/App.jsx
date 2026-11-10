// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import './styles/global.css';
import { DashboardProvider } from './components/dashboard/DashboardContext';
import { getCurrentTheme, setTheme } from './utils/themeUtils';
import { ExamProvider } from './contexts/ExamContext.jsx';

function App() {
  useEffect(() => {
    // Initialize theme when app starts
    const currentTheme = getCurrentTheme();
    setTheme(currentTheme);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Unable to register image sharing support:", error);
      });
    }
  }, []);

  return (
    <ExamProvider>
    <DashboardProvider>
      
      <Router>
        
        <AppRoutes />
      
      </Router>
    </DashboardProvider>
    </ExamProvider>
  );
}

export default App;
