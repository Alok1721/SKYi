import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiSettings, FiLogOut, FiUsers, FiBook, FiFileText, FiCalendar } from 'react-icons/fi';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import './adminComponents.css';

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="admin-sidebar-content">
        <ul className="admin-sidebar-menu">
          <li onClick={() => navigate('/adminDashboard')}>
            <FiHome className="admin-sidebar-icon" />
            <span>Dashboard</span>
          </li>
          <li onClick={() => navigate('/adminQuizMaker')}>
            <FiBook className="admin-sidebar-icon" />
            <span>Quiz Maker</span>
          </li>
          <li onClick={() => navigate('/adminQuestionMaker')}>
            <FiFileText className="admin-sidebar-icon" />
            <span>Question Maker</span>
          </li>
          <li onClick={() => navigate('/adminCAMaker')}>
            <FiCalendar className="admin-sidebar-icon" />
            <span>CA Maker</span>
          </li>
          <li onClick={() => navigate('/settings')}>
            <FiSettings className="admin-sidebar-icon" />
            <span>Settings</span>
          </li>
          <li onClick={handleLogout} className="logout-item">
            <FiLogOut className="admin-sidebar-icon" />
            <span>Logout</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSidebar; 