import { FiMenu } from "react-icons/fi"; // Menu Icon
import { FaFire } from "react-icons/fa"; // Fire Icon
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React from 'react'
import "./dashboardComponents.css";

const UserDashboardHeader = ({ toggleSidebar, daysLeftIAS, userDpURL, pageTitle = "Dashboard" }) => {
  const navigate = useNavigate();

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="menu-button" onClick={toggleSidebar} aria-label="Toggle menu">
          <FiMenu className="menu-icon" />
        </button>
        <h2 className="dashboard-title">{pageTitle}</h2>
      </div>

      <div className="header-center">
        <div className="time-left-container">
          <span className="time-left">{daysLeftIAS ?? 0} Days left</span>
          <FaFire className="fire-icon" />
        </div>
      </div>

      <div className="header-right">
        <button 
          className="profile-button" 
          onClick={() => navigate("/userProfilePage")}
          aria-label="View profile"
        >
          {userDpURL ? (
            <img src={userDpURL} alt="User Profile" className="user-profile-image" />
          ) : (
            <FaUserCircle className="default-profile-icon" />
          )}
        </button>
      </div>
    </header>
  )
}

export default UserDashboardHeader