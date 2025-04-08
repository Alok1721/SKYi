import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiUser } from 'react-icons/fi';
import './adminComponents.css';

const AdminHeader = ({ toggleSidebar, pageTitle = "Admin Dashboard" }) => {
  const navigate = useNavigate();

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button className="admin-menu-button" onClick={toggleSidebar}>
          <FiMenu className="admin-menu-icon" />
        </button>
        <h2 className="admin-title">{pageTitle}</h2>
      </div>
      <div className="admin-header-right">
        <button className="admin-profile-button" onClick={() => navigate('/adminProfile')}>
          <FiUser className="admin-default-profile-icon" />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader; 