import { FiMenu } from "react-icons/fi"; // Menu Icon
import { FaFire } from "react-icons/fa"; // Fire Icon
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React from 'react'
import "./dashboardComponents.css";

const UserDashboardHeader=({toggleSidebar,daysLeftIAS,userDpURL}) => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-header">
      <FiMenu className="menu-icon" onClick={toggleSidebar}/>
      <h2>Dashboard</h2>
      <span className="time-left">{daysLeftIAS??0} Days left</span>
      <FaFire className="fire-icon" />
      <div className="profile-icon" onClick={() => navigate("/userProfilePage")}>
        {userDpURL ? (
          <img src={userDpURL} alt="User Profile" className="user-profile-image" />
        ) : (
          <FaUserCircle className="default-profile-icon" />
        )}
      </div>
    </div>
  )
}

export default UserDashboardHeader