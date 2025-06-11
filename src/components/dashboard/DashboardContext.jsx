import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchDashboardData } from "../../firebaseServices/firebaseData";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useExam } from '../../contexts/ExamContext';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const { examName } = useExam(); // Move useExam to top level
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUserId, setLastUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.uid !== lastUserId || !dashboardData) {
          setLoading(true);
          setError(null);
          fetchDashboardData(user.uid, examName)
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
  }, [lastUserId, dashboardData, examName]); // Add examName to dependencies

  return (
    <DashboardContext.Provider value={{ dashboardData, loading, error }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
