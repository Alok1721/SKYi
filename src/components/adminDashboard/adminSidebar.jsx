import React from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiUser, FiUsers, FiFileText, FiHelpCircle, FiBookOpen, FiBarChart2 } from "react-icons/fi";
import "./adminSidebar.css";

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="close-btn" onClick={toggleSidebar}><FiX /></div>
      <ul>
        <li onClick={() => navigate("/adminDashboard")}>
          <FiBarChart2 className="icon" /> Dashboard
        </li>
        <li onClick={() => navigate("/totalSubscriber")}>
          <FiUsers className="icon" /> Subscribers
        </li>
        <li onClick={() => navigate("/adminQuizMaker")}>
          <FiFileText className="icon" /> Quiz-Maker
        </li>
        <li onClick={() => navigate("/problem-of-day")}>
          <FiHelpCircle className="icon" /> Problem of Day
        </li>
        <li onClick={() => navigate("/practice")}>
          <FiBookOpen className="icon" /> Practice
        </li> 
      </ul>

      <div className="profile">
        <FiUser className="profile-icon" />
        <p className="profile-name">Alok Kumar</p>
        <p className="profile-email">alokkhinjit123@gmail.com</p>
      </div>
    </div>
  );
};

export default AdminSidebar;
