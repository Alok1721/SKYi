import React, { useState } from 'react';
import AdminHeader from '../admin/AdminHeader';
import AdminSidebar from '../admin/AdminSidebar';

const WithAdminHeader = (WrappedComponent, pageTitle) => {
  return function WithAdminHeaderComponent(props) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };

    return (
      <>
        <AdminHeader 
          toggleSidebar={toggleSidebar}
          pageTitle={pageTitle}
        />
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
        />
        <div className={`content-wrapper ${isSidebarOpen ? "shift" : ""}`}>
          <WrappedComponent {...props} />
        </div>
      </>
    );
  };
};

export default WithAdminHeader; 