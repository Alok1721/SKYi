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
import AdminCAMaker from './pages/AdminCAMaker';
import ListOfPdfs from './pages/ListOfPdfs';
import Settings from './components/Settings/Settings';
import UserSettings from './components/Settings/UserSettings';
import WithUserHeader from './components/layout/WithUserHeader';
import WithAdminHeader from './components/layout/WithAdminHeader';
import PdfViewer from './pages/PdfViewer';

// Wrap user pages with WithUserHeader
const UserDashboard = WithUserHeader(Dashboard, "Dashboard");
const UserProfile = WithUserHeader(UserProfilePage, "Profile");
const UserSubs = WithUserHeader(UserSubscriptions, "Subscriptions");
const UserQuizzes = WithUserHeader(AllActiveQuizzes, "All Quizzes");
const UserBacklogs = WithUserHeader(AllActiveBacklogs, "Backlogs");
const UserChallenges = WithUserHeader(TodayChallenges, "Today's Challenges");
const UserPractice = WithUserHeader(UserPractise, "Practice");
const UserPdfs = WithUserHeader(ListOfPdfs, "PDF Resources");
const UserPracticeList = WithUserHeader(ListOfPractises, "Practice List");

// Wrap admin pages with WithAdminHeader
const AdminDashboardPage = WithAdminHeader(AdminDashboard, "Admin Dashboard");
const AdminQuizMakerPage = WithAdminHeader(AdminQuizMaker, "Quiz Maker");
const AdminQuestionMakerPage = WithAdminHeader(AdminQuestionMaker, "Question Maker");
const AdminCAMakerPage = WithAdminHeader(AdminCAMaker, "Current Affairs Maker");


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      
      {/* User Routes */}
      <Route path="/userDashboard" element={<UserDashboard />} />
      <Route path="/userProfilePage" element={<UserProfile />} />
      <Route path="/userSubscriptions" element={<UserSubs />} />
      <Route path="/allActiveQuizzes" element={<UserQuizzes />} />
      <Route path="/allActiveBacklogs" element={<UserBacklogs />} />
      <Route path="/todayChallenges" element={<UserChallenges />} />
      <Route path="/userPractise" element={<UserPractice />} />
      <Route path="/listOfPdfs" element={<UserPdfs />} />
      <Route path="/listOfPractise" element={<UserPracticeList />} />
      <Route path="/userSettings" element={<UserSettings />} />
      
      {/* Admin Routes */}
      <Route path="/adminDashboard" element={<AdminDashboardPage />} />
      <Route path="/adminQuizMaker" element={<AdminQuizMakerPage />} />
      <Route path="/adminQuestionMaker" element={<AdminQuestionMakerPage />} />
      <Route path="/adminCAMaker" element={<AdminCAMakerPage />} />
      <Route path="/settings" element={<Settings />} />
      
      {/* Special Routes (without header) */}
      <Route path="/testZone" element={<TestZone />} />
      <Route path="/quizResult" element={<QuizResult />} />
      <Route path="/view-pdf" element={<PdfViewer />} />
      
      {/* Catch-all route */}
    </Routes>
  );
}

export default AppRoutes;
