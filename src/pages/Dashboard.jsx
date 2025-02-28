import React,{useState,createContext,useContext,useEffect} from "react";
import "../styles/dashboard.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import UserDashboardHeader from "../components/dashboard/dashboardHeader";
import { useNavigate } from 'react-router-dom';
import UserSidebar from "../components/dashboard/userSidebar";
import { useDashboard } from "../components/dashboard/DashboardContext";
import ProgressOverview from "../components/dashboard/progressBar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }
  const {dashboardData,loading} = useDashboard();
  const totalQuizzes = dashboardData?.totalQuizzes;
  const todayChallenges = dashboardData?.todayChallenges;
  const totalBacklogs = dashboardData?.totalBacklogs;
  const daysLeftIAS = dashboardData?.daysLeftIAS;
  const userName = dashboardData?.userName;
  const userEmail=dashboardData?.userEmail;
  const userDpURL=dashboardData?.userDpURL;
  const progressData=dashboardData?.progressData;
  const graphData=dashboardData?.graphData;
  const data = graphData;
  const podData=dashboardData?.podData ||[];
  console.log("podData",podData);
  const generateDateForGrid = (month, idx) => {
    const monthIndex = months.indexOf(month); // Get month index (0-11)
    const year = 2025; // Use a static year for now
    const day = idx + 1; // Simulate dates for now
    return new Date(year, monthIndex, day).toISOString().split("T")[0];
  };
  
  
  const months = ["January", "February", "March", "April","May","June","July","August","September","October","November","December"];
  return (
    <>
    <UserDashboardHeader toggleSidebar={toggleSidebar} daysLeftIAS={daysLeftIAS} userDpURL={userDpURL}/>
    <UserSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar}  userName={userName} userEmail={userEmail}/>
    <div className={`dashboard ${isSidebarOpen ? "shift" : ""}`}>
      <div className="stats">
        <div className="stat-card" onClick={() => navigate('/allActiveQuizzes')}>
          <span>{totalQuizzes ?? 0}</span>
          <p>Total Quizzes</p>
        </div>
        <div className="stat-card" onClick={() => navigate('/todayChallenges')}>
          <span>{todayChallenges ??0}</span>
          {/* <p>Today Assessments</p> */}
          <p>Today Challenges</p>
        </div>
        <div className="stat-card" onClick={() => navigate('/allActiveBacklogs')}>
          <span>{totalBacklogs??0}</span>
          <p>Backlogs</p>
        </div>
      </div>

      <div className="progress-chart-container">
        <ProgressOverview progressData={progressData || []}/>
        {/* Line Chart */}
        <div className="chart">
          <LineChart width={500} height={200} data={data}>
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </div>
      </div>

      <div className="calender-container">
  {months.map((month, index) => (
    <div key={index} className="calendar">
      <h3>{month}</h3>
      <div className="calender-grid">
        {Array.from({ length: 42 }).map((_, idx) => {
          const date = generateDateForGrid(month, idx); // Get the actual date
          const pod = podData?.find((item) => item.date === date);
          const completedClass = pod && pod.completedPOD ? "completed-pod" : "";

          return <div key={idx} className={`calender-box ${completedClass}`}></div>;
        })}
      </div>
    </div>
  ))}
</div>

    </div>
    </>
  );
};

export default Dashboard;
