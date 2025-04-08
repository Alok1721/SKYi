import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FiLoader, FiUser } from "react-icons/fi";
import "../styles/userSubscriptions.css";
import { ProfileCard } from "../components/subscriptions/profileCard";
import { fetchUserData } from "../firebaseServices/fetch_users";
import { getCurrentUser } from "../firebaseServices/current_user";

const UserSubscriptions = () => {
  const location = useLocation();
  const [adminList, setAdminList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [userData, adminData] = await Promise.all([
          getCurrentUser(),
          fetchUserData()
        ]);

        setCurrentUser(userData);
        if (adminData && adminData.adminList) {
          setAdminList(adminData.adminList);
        }
      } catch (err) {
        setError("Failed to load subscription data");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <FiUser className="empty-state-icon" />
        <p className="empty-state-text">{error}</p>
      </div>
    );
  }

  if (adminList.length === 0) {
    return (
      <div className="empty-state">
        <FiUser className="empty-state-icon" />
        <p className="empty-state-text">No subscriptions found</p>
      </div>
    );
  }

  return (
    <div className="user-subscriptions">
      {adminList.map((admin, index) => (
        <ProfileCard 
          key={index} 
          user={admin} 
          currentUser={currentUser} 
        />
      ))}
    </div>
  );
};

export default UserSubscriptions;
