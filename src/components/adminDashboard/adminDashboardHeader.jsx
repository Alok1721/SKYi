import { FiMenu } from "react-icons/fi"; // Menu Icon
import { FaUserCircle } from "react-icons/fa";

import React from 'react'
import "./adminDashboardComponents.css";

const AdminDashboardHeader=({toggleSidebar}) => {
  return (
    <div className="dashboard-header">
      <FiMenu className="menu-icon" onClick={toggleSidebar}/>
      <h2>Admin Dashboard</h2>
      <FaUserCircle className="profile-icon" />
    </div>
  )
}

export default AdminDashboardHeader