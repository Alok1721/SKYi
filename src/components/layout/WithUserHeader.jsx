import React, { useState } from 'react';
import UserDashboardHeader from '../dashboard/dashboardHeader';
import UserSidebar from '../dashboard/userSidebar';
import { useDashboard } from '../dashboard/DashboardContext';

const WithUserHeader = (WrappedComponent, pageTitle) => {
  return function WithUserHeaderComponent(props) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { dashboardData } = useDashboard();
    const { daysLeftIAS, userDpURL, userName, userEmail } = dashboardData || {};

    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };

    return (
      <>
        <UserDashboardHeader 
          toggleSidebar={toggleSidebar} 
          daysLeftIAS={daysLeftIAS} 
          userDpURL={userDpURL}
          pageTitle={pageTitle}
        />
        <UserSidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          userName={userName} 
          userEmail={userEmail} 
        />
        <div className={`content-wrapper ${isSidebarOpen ? "shift" : ""}`}>
          <WrappedComponent {...props} />
        </div>
      </>
    );
  };
};

export default WithUserHeader; 