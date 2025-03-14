// src/Routes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import TodayChallenges from './pages/TodayChallenges';
import TestZone from './pages/TestZone';
import QuizResult from './pages/QuizResult';
import AdminQuizMaker from './pages/AdminQuizMaker';
import AllActiveQuizzes from './pages/AllActiveQuiz';
import AllActiveBacklogs from './pages/AllActiveBacklogs';
import UserProfilePage from './pages/UserProfilePage';
import UserSubscriptions from './pages/UserSubscriptions';
import UserPractise from './pages/UserPractise';
import ListOfPractises from './pages/ListOfPractises';
import AdminQuestionMaker from './pages/AdminQuestionMaker';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/userDashboard" element={<Dashboard />} />
      <Route path="/adminDashboard" element={<AdminDashboard />} />
      <Route path="/todayChallenges" element={<TodayChallenges />} />
      <Route path="/testZone" element={<TestZone />} />
      <Route path="/quizResult" element={<QuizResult />} />
      <Route path="/adminQuizMaker" element={<AdminQuizMaker />} />
      <Route path="/allActiveQuizzes" element={<AllActiveQuizzes />} />
      <Route path="/allActiveBacklogs" element={<AllActiveBacklogs />} />
      <Route path="/userProfilePage" element={<UserProfilePage />} />
      <Route path="/userSubscriptions" element={<UserSubscriptions />} />
      <Route path="/userPractise" element={<UserPractise />} />
      <Route path="/adminQuestionMaker" element={<AdminQuestionMaker />} />
      <Route path="/listOfPractise" element={<ListOfPractises />} />
      
    </Routes>
  );
}

export default AppRoutes;
