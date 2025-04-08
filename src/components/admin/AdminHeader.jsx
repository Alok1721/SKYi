import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiUser } from 'react-icons/fi';
import './adminComponents.css';

const AdminHeader = ({ toggleSidebar, pageTitle = "Admin Dashboard" }) => {
  const navigate = useNavigate();

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="menu-button" onClick={toggleSidebar}>
          <FiMenu className="menu-icon" />
        </button>
        <h2 className="admin-title">{pageTitle}</h2>
      </div>
      <div className="header-right">
        <button className="profile-button" onClick={() => navigate('/adminProfile')}>
          <FiUser className="default-profile-icon" />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader; 