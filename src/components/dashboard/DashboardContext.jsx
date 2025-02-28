import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchDashboardData } from "../../firebaseServices/firebaseData";
import { auth,db, storage} from "../../firebaseConfig"; // Firebase authentication
import { onAuthStateChanged } from "firebase/auth";

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe=onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchDashboardData(user.uid).then((data) => {
          setDashboardData(data);
          setLoading(false);
        });
      }
      else{
        setDashboardData(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }
  , []);

  return (
    <DashboardContext.Provider value={{ dashboardData, loading }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
