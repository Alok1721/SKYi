// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import './styles/global.css';
import { DashboardProvider } from './components/dashboard/DashboardContext';


function App() {
  return (
    <DashboardProvider>
    <Router>
      <AppRoutes />
    </Router>
    </DashboardProvider>
  );
}

export default App;
