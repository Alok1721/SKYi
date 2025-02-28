import { FiMenu } from "react-icons/fi"; // Menu Icon
import { FaUserCircle } from "react-icons/fa";

import React from 'react'
import "./adminDashboardComponents.css";

const AdminDashboardHeader=({toggleSidebar}) => {
  return (
    <div className="admin-dashboard-header">
      <FiMenu className="admin-menu-icon" onClick={toggleSidebar}/>
      <h2>Admin Dashboard</h2>
      <FaUserCircle className="admin-profile-icon" />
    </div>
  )
}

export default AdminDashboardHeader