import React, { useState } from "react";
import "../styles/adminDashboard.css";
import AdminDashboardHeader from "../components/adminDashboard/adminDashboardHeader";
import { useNavigate } from 'react-router-dom';
import AdminSidebar from "../components/adminDashboard/adminSidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }
  return (
    <div className="ad-admin-dashboard-container">
      <AdminDashboardHeader toggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`ad-admin-dashboard ${isSidebarOpen ? "shift" : ""}`}>
        <div className="ad-admin-stats">
          <div className="ad-admin-stat-card" onClick={() => navigate('/adminCAMaker')}>
            <span>20</span>
            <p>CA Maker</p>
          </div>
          <div className="ad-admin-stat-card" onClick={() => navigate('/adminQuizMaker')}>
            <span>5</span>
            <p>Quiz Maker</p>
          </div>
          <div className="ad-admin-stat-card" onClick={()=>navigate('/adminQuestionMaker')}>
            <span>10</span>
            <p>Practice Creation</p>
          </div>
        </div>

        <div className="ad-admin-progress-chart-container">
          {/* Progress Overview */}
          <div className="ad-admin-progress-overview">
            <div className="ad-admin-progress-circle">
              <div className="ad-admin-circle">
                <p>60%<br />Solving Rate</p>
              </div>
            </div>
            <div className="ad-admin-progress-list">
              <p><span className="ad-admin-correct"></span> Polity</p>
              <p><span className="ad-admin-correct"></span> History</p>
              <p><span className="ad-admin-incorrect"></span> Geo</p>
              <p><span className="ad-admin-incorrect"></span> CA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
