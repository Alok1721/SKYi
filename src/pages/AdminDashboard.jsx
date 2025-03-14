import React,{useState} from "react";
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
    <>
    
    <AdminDashboardHeader toggleSidebar={toggleSidebar} />
    <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    <div className={`admin-dashboard ${isSidebarOpen ? "shift" : ""}`}>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span>20</span>
          <p>Total Subscribers</p>
        </div>
        <div className="admin-stat-card" onClick={() => navigate('/adminQuizMaker')}>
          <span>5</span>
          <p>Quiz Maker</p>
        </div>
        <div className="admin-stat-card" onClick={()=>navigate('/adminQuestionMaker')}>
          <span>10</span>
          <p>Practice Creation</p>
        </div>
      </div>

      <div className="admin-progress-chart-container">
        {/* Progress Overview */}
        <div className="admin-progress-overview">
          <div className="admin-progress-circle">
            <div className="admin-circle">
              <p>60%<br />Solving Rate</p>
            </div>
          </div>
          <div className="admin-progress-list">
            <p><span className="admin-correct"></span> Polity</p>
            <p><span className="admin-correct"></span> History</p>
            <p><span className="admin-incorrect"></span> Geo</p>
            <p><span className="admin-incorrect"></span> CA</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
