import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WithUserHeader from './components/layout/WithUserHeader';
import WithAdminHeader from './components/layout/WithAdminHeader';

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
import ListSettings from './components/Settings/AdminSettings';
import ListUserSettings from './components/Settings/UserSettings';
import PdfViewer from './pages/PdfViewer';
import AdminExamMigration from './pages/AdminExamMigration';
import SubscriberDetailsPage from "./pages/SubscriberDetailsPage";
import AdminSubscriberList from "./pages/AdminSubscriberList";

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
const UserSettings = WithUserHeader(ListUserSettings, "User Setting");

// Wrap admin pages with WithAdminHeader
const AdminDashboardPage = WithAdminHeader(AdminDashboard, "Admin Dashboard");
const AdminQuizMakerPage = WithAdminHeader(AdminQuizMaker, "Quiz Maker");
const AdminQuestionMakerPage = WithAdminHeader(AdminQuestionMaker, "Question Maker");
const AdminCAMakerPage = WithAdminHeader(AdminCAMaker, "Current Affairs Maker");
const AdminExamMigrationPage = WithAdminHeader(AdminExamMigration, "Exam Migration");
const Settings = WithAdminHeader(ListSettings, "Admin Setting");
const AAdminSubscriberList = WithAdminHeader(AdminSubscriberList, "Subscribers List");
const SSubscriberDetailsPage = WithAdminHeader(SubscriberDetailsPage, "Subscribers Details");

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
      <Route path="/adminExamMigration" element={<AdminExamMigrationPage />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/subscriber/:userId" element={<SSubscriberDetailsPage />} />
      <Route path="/admin/subscribers" element={<AAdminSubscriberList />} />
      
      {/* Special Routes (without header) */}
      <Route path="/testZone" element={<TestZone />} />
      <Route path="/quizResult" element={<QuizResult />} />
      <Route path="/view-pdf" element={<PdfViewer />} />
      
      {/* Catch-all route */}
    </Routes>
  );
}

export default AppRoutes;