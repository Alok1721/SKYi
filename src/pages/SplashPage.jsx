// src/pages/LoginPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/loginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="title">IAS Preparation Quiz</h2>
        <p className="quote">"Success is the sum of small efforts, repeated day in and day out." – Robert Collier</p>
        <button className="btn" onClick={() => navigate('/adminDashboard')}>Admin Login</button>
        <button className="btn" onClick={() => navigate('/login')}>User Login</button>
        <button className="btn" onClick={() => navigate('/signup')}>Sign Up</button>
        <button className="btn guest" onClick={() => navigate('/quiz')}>Continue as Guest</button>
      </div>
    </div>
  );
}

export default LoginPage;
