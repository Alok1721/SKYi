import React, { useState, useEffect, useRef } from "react";
import "../styles/dashboard.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import UserDashboardHeader from "../components/dashboard/dashboardHeader";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../components/dashboard/userSidebar";
import { useDashboard } from "../components/dashboard/DashboardContext";
import ProgressOverview from "../components/dashboard/progressBar";
import { getCurrentTheme } from "../utils/themeUtils";
import { format } from 'date-fns';
import LoadingScreen from "../components/loadingScreen/LoadingScreen";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("this-month");
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
  const [chartFilter, setChartFilter] = useState("this-month");
  const chartContainerRef = useRef(null);

  useEffect(() => {
    const handleThemeChange = () => {
      setCurrentTheme(getCurrentTheme());
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const { dashboardData,isLoading } = useDashboard();
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

  // Get current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentDay = currentDate.getDate();

  // Helper functions
  const daysInMonth = (monthIndex, year) => new Date(year, monthIndex + 1, 0).getDate();

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    startOfWeek.setDate(currentDay - dayOfWeek); // Start from Sunday
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const months = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"
  ];

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd-MMM-yy');
  };

  // Function to filter chart data based on selected filter
  const getFilteredChartData = () => {
    const today = new Date();
    let startDate = new Date();

    switch (chartFilter) {
      case "this-week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "this-month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "last-3-months":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "last-6-months":
        startDate.setMonth(today.getMonth() - 6);
        break;
      case "this-year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default: // all-time
        return graphData;
    }

    return graphData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= today;
    });
  };

  // Function to render calendar based on filter
  const renderCalendar = () => {
    switch (selectedFilter) {
      case "this-week":
        const weekDays = getWeekDays();
        return (
          <div className="calendar">
            <h3>This Week</h3>
            <div className="calendar-grid week-grid">
              {weekDays.map((date, idx) => {
                const formattedDate = date.toISOString().split('T')[0];
                const pod = podData.find((item) => item.date === formattedDate);
                const completedClass = pod && pod.completedPOD ? "completed-pod" : "";
                
                return (
                  <div
                    key={idx}
                    className={`calendar-box ${completedClass}`}
                    onMouseEnter={() => setHoveredDate(formattedDate)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    
                    {hoveredDate === formattedDate && <div className="tooltip">{formattedDate}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "this-month":
        const numDaysCurrentMonth = daysInMonth(currentMonth, currentYear);
        return (
          <div className="calendar">
            <h3>{months[currentMonth]}</h3>
            <div className="calendar-grid">
              {Array.from({ length: numDaysCurrentMonth }).map((_, dayIdx) => {
                const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayIdx + 1).padStart(2, "0")}`;
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

      case "2024":
      case "2025":
        const year = parseInt(selectedFilter);
        return months.map((month, index) => {
          const numDays = daysInMonth(index, year);
          return (
            <div key={index} className="calendar">
              <h3>{month}</h3>
              <div className="calendar-grid">
                {Array.from({ length: numDays }).map((_, dayIdx) => {
                  const date = `${year}-${String(index + 1).padStart(2, "0")}-${String(dayIdx + 1).padStart(2, "0")}`;
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
        });

      default:
        return null;
    }
  };
  if (isLoading && !dashboardData) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

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
          <div className="chart-wrapper" ref={chartContainerRef}>
            <div className="chart-header">
              <select 
                value={chartFilter} 
                onChange={(e) => setChartFilter(e.target.value)}
                className="chart-filter"
              >
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="this-year">This Year</option>
                <option value="all-time">All Time</option>
              </select>
            </div>
            <div className="chart">
              <LineChart 
                width={chartContainerRef.current?.offsetWidth || 500} 
                height={200} 
                data={getFilteredChartData()}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="2 2" 
                  stroke={currentTheme === 'dark' ? '#404248' : '#e5e7eb'}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke={currentTheme === 'dark' ? '#a0aec0' : '#666666'}
                  tick={{ fill: currentTheme === 'dark' ? '#a0aec0' : '#666666' }}
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke={currentTheme === 'dark' ? '#a0aec0' : '#666666'}
                  tick={{ fill: currentTheme === 'dark' ? '#a0aec0' : '#666666' }}
                  domain={['dataMin', 'dataMax']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: currentTheme === 'dark' ? '#2d2e32' : '#ffffff',
                    border: `1px solid ${currentTheme === 'dark' ? '#404248' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: currentTheme === 'dark' ? '#e1e1e1' : '#333333'
                  }}
                  labelStyle={{ color: currentTheme === 'dark' ? '#a0aec0' : '#666666' }}
                  formatter={(value) => [value, 'Score']}
                  labelFormatter={formatDate}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={currentTheme === 'dark' ? '#60a5fa' : '#3b82f6'} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </div>
          </div>
        </div>

        <div className="calender-wrapper">
          <div className="calendar-filter">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="filter-icon"
            >
              <path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z" />
            </svg>
            <select value={selectedFilter} onChange={handleFilterChange}>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
            </select>
          </div>
          <div className="calendar-container">
            {renderCalendar()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;