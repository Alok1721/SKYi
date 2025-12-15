import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiX,
  FiUser,
  FiUsers,
  FiFileText,
  FiBookOpen,
  FiBarChart2,
  FiLogOut,
  FiSettings,
} from "react-icons/fi";
import "./adminSidebar.css";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { getUserProfile } from "../../firebaseServices/auth";

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  /* -------- LOAD ADMIN PROFILE -------- */
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const data = await getUserProfile();
        setAdmin(data);
      } catch (err) {
        console.error("Failed to load admin profile", err);
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, []);

  /* -------- LOGOUT -------- */
  const handleLogout = async () => {
    try {
      localStorage.removeItem("user");
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Failed to log out:", err.message);
    }
  };

  return (
    <div className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div className="admin-close-btn" onClick={toggleSidebar}>
        <FiX />
      </div>

      <ul>
        <li onClick={() => navigate("/adminDashboard")}>
          <FiBarChart2 className="admin-icon" /> Dashboard
        </li>
        <li onClick={() => navigate("/admin/subscribers")}>
          <FiUsers className="admin-icon" /> Subscribers
        </li>
        <li onClick={() => navigate("/adminQuizMaker")}>
          <FiFileText className="admin-icon" /> Quiz-Maker
        </li>
        <li onClick={() => navigate("/adminQuestionMaker")}>
          <FiBookOpen className="admin-icon" /> Question-Maker
        </li>
        <li onClick={() => navigate("/settings")}>
          <FiSettings className="admin-icon" /> Settings
        </li>
      </ul>

      {/* -------- ADMIN PROFILE -------- */}
      <div className="admin-profile">
        <FiUser className="admin-profile-icon" />

        {loading ? (
          <p className="admin-profile-name">Loading...</p>
        ) : (
          <>
            <p className="admin-profile-name">
              {admin?.name || "Admin"}
            </p>
            <p className="admin-profile-email">
              {admin?.email || ""}
            </p>
          </>
        )}
      </div>

      {/* -------- LOGOUT -------- */}
      <div className="admin-bottom-section">
        <button className="admin-logout-btn" onClick={handleLogout}>
          <FiLogOut className="admin-logout-icon" />
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
