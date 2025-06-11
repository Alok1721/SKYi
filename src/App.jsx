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
