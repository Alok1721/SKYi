import React from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiUser, FiUsers, FiFileText, FiHelpCircle, FiBookOpen, FiBarChart2 ,FiCodesandbox,FiLogOut} from "react-icons/fi";
import "./userSidebar.css";
import {signOut} from "firebase/auth"
import {auth} from "../../firebaseConfig"

const UserSidebar = ({ isOpen, toggleSidebar ,userName,userEmail}) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      localStorage.removeItem("user");
      await signOut(auth);
      navigate("/"); // Redirect to login page
    } catch (err) {
      console.error("Failed to log out:", err.message);
    }
  };
  return (
    <div className={`user-sidebar ${isOpen ? "open" : ""}`}>
      <div className="user-close-btn" onClick={toggleSidebar}><FiX /></div>
      <ul>
        <li onClick={() => navigate("/userDashboard")}>
          <FiBarChart2 className="user-icon" /> Dashboard
        </li>
        <li onClick={() => navigate("/todayChallenges")}>
          <FiUsers className="user-icon" /> ToDayChallenges
        </li>
        <li onClick={() => navigate("/allActiveQuizzes")}>
          <FiFileText className="user-icon" /> ALL Quiz
        </li>
        <li onClick={() => navigate("/allActiveBacklogs")}>
          <FiHelpCircle className="user-icon" /> Backlogs Page
        </li>
        <li onClick={() => navigate("/userPractice")}>
          <FiBookOpen className="user-icon" /> Practice
        </li> 
        <li onClick={() => navigate("/userSubscriptions")}>
          <FiCodesandbox className="user-icon" /> Subscriptions
        </li> 
      </ul>
      <div className="user-profile">
          <FiUser className="user-profile-icon" />
          <p className="user-profile-name">{userName??"Guest"}</p>
          <p className="user-profile-email">{userEmail??"guest@gmail.com"}</p>
        </div>

      <div className="user-bottom-section">
        

        <button className="user-logout-btn" onClick={handleLogout}>
          <FiLogOut className="user-logout-icon"/>
        </button>


      </div>
    </div>
  );
};

export default UserSidebar;
