import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchDashboardData } from "../../firebaseServices/firebaseData";
import { auth } from "../../firebaseConfig"; // Only need auth here
import { onAuthStateChanged } from "firebase/auth";

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null); 
  const [loading, setLoading] = useState(false); // true for active fetch
  const [error, setError] = useState(null); 
  const [lastUserId, setLastUserId] = useState(null); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.uid !== lastUserId || !dashboardData) {
          setLoading(true); 
          setError(null); 
          fetchDashboardData(user.uid)
            .then((data) => {
              setDashboardData(data);
              setLastUserId(user.uid); 
            })
            .catch((err) => {
              console.error("Error fetching dashboard data:", err);
              setError(err.message || "Failed to load dashboard data");
              setDashboardData({}); 
            })
            .finally(() => {
              setLoading(false); 
            });
        }
      } else {
        setDashboardData(null);
        setLastUserId(null);
        setLoading(false);
        setError(null);
      }
    });

    return () => unsubscribe(); 
  }, []); 

  return (
    <DashboardContext.Provider value={{ dashboardData, loading, error }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);