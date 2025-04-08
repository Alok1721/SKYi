import React, { useState } from 'react';
import AdminHeader from '../admin/AdminHeader';
import AdminSidebar from '../adminDashboard/adminSidebar';
import './layout.css';

const WithAdminHeader = (WrappedComponent, pageTitle) => {
  return function WithAdminHeaderComponent(props) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };

    return (
      <div className="admin-layout">
        <AdminHeader 
          toggleSidebar={toggleSidebar}
          pageTitle={pageTitle}
        />
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
        />
        <div className={`admin-content-wrapper ${isSidebarOpen ? "shift" : ""}`}>
          <WrappedComponent {...props} />
        </div>
      </div>
    );
  };
};

export default WithAdminHeader; 