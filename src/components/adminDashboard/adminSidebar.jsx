import React from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiUser, FiUsers, FiFileText, FiHelpCircle, FiBookOpen, FiBarChart2,FiLogOut, FiSettings } from "react-icons/fi";
import "./adminSidebar.css";
import {signOut} from "firebase/auth"
import {auth} from "../../firebaseConfig"
const AdminSidebar = ({ isOpen, toggleSidebar }) => {
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
    <div className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div className="admin-close-btn" onClick={toggleSidebar}><FiX /></div>
      <ul>
        <li onClick={() => navigate("/adminDashboard")}>
          <FiBarChart2 className="admin-icon" /> Dashboard
        </li>
        <li onClick={() => navigate("/totalSubscriber")}>
          <FiUsers className="admin-icon" /> Subscribers
        </li>
        <li onClick={() => navigate("/adminQuizMaker")}>
          <FiFileText className="admin-icon" /> Quiz-Maker
        </li>
        <li onClick={() => navigate("/problem-of-day")}>
          <FiHelpCircle className="admin-icon" /> Problem of Day
        </li>
        <li onClick={() => navigate("/practice")}>
          <FiBookOpen className="admin-icon" /> Practice
        </li>
        <li onClick={() => navigate("/settings")}>
          <FiSettings className="admin-icon" /> Settings
        </li>
      </ul>

      <div className="admin-profile">
        <FiUser className="admin-profile-icon" />
        <p className="admin-profile-name">Alok Kumar</p>
        <p className="admin-profile-email">alokkhinjit123@gmail.com</p>
      </div>
      <div className="admin-bottom-section">
              
      
              <button className="admin-logout-btn" onClick={handleLogout}>
                <FiLogOut className="admin-logout-icon"/>
              </button>
      
      
      </div>
    </div>
  );
};

export default AdminSidebar;
