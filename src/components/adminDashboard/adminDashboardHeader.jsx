import React from 'react';
import { FiMenu } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import "./adminDashboardComponents.css";

const AdminDashboardHeader = ({ toggleSidebar }) => {
  return (
    <header className="admin-dashboard-header">
      <div className="admin-header-left">
        <FiMenu className="admin-menu-icon" onClick={toggleSidebar} />
        <h2 className="admin-header-title">Admin Dashboard</h2>
      </div>
      <div className="admin-header-right">
        <FaUserCircle className="admin-profile-icon" />
      </div>
    </header>
  );
};

export default AdminDashboardHeader;