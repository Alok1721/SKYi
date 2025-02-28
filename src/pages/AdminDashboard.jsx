import React,{useState} from "react";
import "../styles/dashboard.css";
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
    <div className={`dashboard ${isSidebarOpen ? "shift" : ""}`}>
      <div className="stats">
        <div className="stat-card">
          <span>20</span>
          <p>Total Subscribers</p>
        </div>
        <div className="stat-card">
          <span>5</span>
          {/* <p>Today Assessments</p> */}
        <button className="btn" onClick={() => navigate('/adminQuizMaker')}>Quiz Maker</button>
        </div>
        <div className="stat-card">
          <span>10</span>
          <p>Practice Creation</p>
        </div>
      </div>

      <div className="progress-chart-container">
        {/* Progress Overview */}
        <div className="progress-overview">
          <div className="progress-circle">
            <div className="circle">
              <p>60%<br />Solving Rate</p>
            </div>
          </div>
          <div className="progress-list">
            <p><span className="correct"></span> Polity</p>
            <p><span className="correct"></span> History</p>
            <p><span className="incorrect"></span> Geo</p>
            <p><span className="incorrect"></span> CA</p>
          </div>
        </div>

        
      </div>
      <div className="progress-chart-container">
        {/* Progress Overview */}
        <div className="progress-overview">
          <div className="progress-circle">
            <div className="circle">
              <p>60%<br />POD Solved</p>
            </div>
          </div>
          <div className="progress-list">
            <p><span className="correct"></span> Polity</p>
            <p><span className="correct"></span> History</p>
            <p><span className="incorrect"></span> Geo</p>
            <p><span className="incorrect"></span> CA</p>
          </div>
        </div>

        
      </div>
      <div className="progress-chart-container">
        {/* Progress Overview */}
        <div className="progress-overview">
          <div className="progress-circle">
            <div className="circle">
              <p>60%<br />Correct</p>
            </div>
          </div>
          <div className="progress-list">
            <p><span className="correct"></span> Polity</p>
            <p><span className="correct"></span> History</p>
            <p><span className="incorrect"></span> Geo</p>
            <p><span className="incorrect"></span> CA</p>
          </div>
        </div>

        
      </div>

      
    </div>
    </>
  );
};

export default Dashboard;
