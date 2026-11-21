import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiX, FiUser, FiUsers, FiFileText, FiHelpCircle, FiBookOpen, FiBarChart2, FiCodesandbox, FiLogOut, FiSettings, FiImage } from "react-icons/fi";
import "./userSidebar.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import UserStorageQuota from "../storage/UserStorageQuota";

// eslint-disable-next-line react/prop-types
const UserSidebar = ({ isOpen, toggleSidebar, userName, userEmail, userDpURL }) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(auth.currentUser?.uid);

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    setUserId(currentUser?.uid);
  }), []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("user");
      await signOut(auth);
        navigate("/");
    } catch (err) {
      console.error("Failed to log out:", err.message);
    }
  };
  const links = [
    { to: "/userDashboard", label: "Dashboard", Icon: FiBarChart2 },
    { to: "/todayChallenges", label: "Today’s Challenges", Icon: FiUsers },
    { to: "/allActiveQuizzes", label: "All Quizzes", Icon: FiFileText },
    { to: "/allActiveBacklogs", label: "Backlogs", Icon: FiHelpCircle },
    { to: "/userPractise", label: "Practice", Icon: FiBookOpen },
    { to: "/userImageLibrary", label: "Image Library", Icon: FiImage },
    { to: "/userSubscriptions", label: "Subscriptions", Icon: FiCodesandbox },
    { to: "/userSettings", label: "Settings", Icon: FiSettings },
  ];

  return (
    <aside className={`user-sidebar ${isOpen ? "open" : ""}`} aria-label="User navigation">
      <button className="user-close-btn" type="button" onClick={toggleSidebar} aria-label="Close navigation"><FiX /></button>
      <nav className="user-sidebar-navigation">
        <p className="user-sidebar-label">YOUR SPACE</p>
        <ul>
          {links.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink to={to} end={to === "/userDashboard"} className={({ isActive }) => `user-sidebar-link${isActive ? " active" : ""}`}>
                <Icon className="user-icon" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="user-sidebar-bottom">
        <button className="user-profile" type="button" onClick={() => navigate("/userProfilePage")}>
          {userDpURL ? <img src={userDpURL} alt="" className="user-profile-image" /> : <FiUser className="user-profile-icon" />}
          <span className="user-profile-copy">
            <span className="user-profile-name">{userName || "Guest"}</span>
            <span className="user-profile-email">{userEmail || "Guest account"}</span>
          </span>
        </button>
        <UserStorageQuota userId={userId} compact />
        <button className="user-logout-btn" type="button" onClick={handleLogout}>
          <FiLogOut className="user-logout-icon" /> <span>Sign out</span>
          </button>
      </div>
    </aside>
  );
};

export default UserSidebar;
