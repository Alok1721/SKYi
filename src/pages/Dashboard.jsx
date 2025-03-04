import React, { useState } from "react";
import "../styles/dashboard.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import UserDashboardHeader from "../components/dashboard/dashboardHeader";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../components/dashboard/userSidebar";
import { useDashboard } from "../components/dashboard/DashboardContext";
import ProgressOverview from "../components/dashboard/progressBar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const { dashboardData } = useDashboard();
  const totalQuizzes = dashboardData?.totalQuizzes ?? 0;
  const todayChallenges = dashboardData?.todayChallenges ?? 0;
  const totalBacklogs = dashboardData?.totalBacklogs ?? 0;
  const daysLeftIAS = dashboardData?.daysLeftIAS;
  const userName = dashboardData?.userName;
  const userEmail = dashboardData?.userEmail;
  const userDpURL = dashboardData?.userDpURL;
  const progressData = dashboardData?.progressData || [];
  const graphData = dashboardData?.graphData || [];
  const podData = dashboardData?.podData || [];

  // Define number of days in each month (leap year consideration)
  const daysInMonth = (monthIndex, year = 2025) => new Date(year, monthIndex + 1, 0).getDate();

  const months = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"
  ];

  return (
    <>
      <UserDashboardHeader toggleSidebar={toggleSidebar} daysLeftIAS={daysLeftIAS} userDpURL={userDpURL} />
      <UserSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} userName={userName} userEmail={userEmail} />
      <div className={`dashboard ${isSidebarOpen ? "shift" : ""}`}>
        <div className="stats">
          <div className="stat-card" onClick={() => navigate('/allActiveQuizzes')}>
            <span>{totalQuizzes}</span>
            <p>Total Quizzes</p>
          </div>
          <div className="stat-card" onClick={() => navigate('/todayChallenges')}>
            <span>{todayChallenges}</span>
            <p>Today Challenges</p>
          </div>
          <div className="stat-card" onClick={() => navigate('/allActiveBacklogs')}>
            <span>{totalBacklogs}</span>
            <p>Backlogs</p>
          </div>
        </div>

        <div className="progress-chart-container">
          <ProgressOverview progressData={progressData} />
          <div className="chart">
            <LineChart width={500} height={200} data={graphData}>
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="calendar-container">
          <div className="calender-filter">
            <p>POD Tracker</p>
          </div>
          {months.map((month, index) => {
            const numDays = daysInMonth(index);
            return (
              <div key={index} className="calendar">
                <h3>{month}</h3>
                <div className="calendar-grid">
                  {Array.from({ length: numDays }).map((_, dayIdx) => {
                    const date = `2025-${String(index + 1).padStart(2, "0")}-${String(dayIdx + 1).padStart(2, "0")}`;
                    const pod = podData.find((item) => item.date === date);
                    const completedClass = pod && pod.completedPOD ? "completed-pod" : "";

                    return (
                      <div
                        key={dayIdx}
                        className={`calendar-box ${completedClass}`}
                        onMouseEnter={() => setHoveredDate(date)}
                        onMouseLeave={() => setHoveredDate(null)}
                      >
                        {hoveredDate === date && <div className="tooltip">{date}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
