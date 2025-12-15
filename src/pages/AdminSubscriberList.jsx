import React, { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "../styles/adminSubscriberList.css";

/* -------- SERVICES -------- */
import { getAdminSubscribers } from "../firebaseServices/admin_service";
import { subscribeUserStatus } from "../firebaseServices/user_status_service";

const AdminSubscriberList = () => {
  const [users, setUsers] = useState([]);
  const [userStatusMap, setUserStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  /* ---------------- FETCH SUBSCRIBERS ---------------- */
  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        const adminId = auth.currentUser?.uid;

        if (!adminId) {
          setMessage("Admin not authenticated.");
          return;
        }

        const subscribers = await getAdminSubscribers(adminId);

        if (subscribers.length === 0) {
          setMessage("No users have subscribed to you yet.");
        }

        setUsers(subscribers);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load subscribers.");
      } finally {
        setLoading(false);
      }
    };

    loadSubscribers();
  }, []);

  /* ---------------- ONLINE / OFFLINE STATUS ---------------- */
  useEffect(() => {
  console.log("STATUS MAP:", userStatusMap);
}, [userStatusMap]);

  useEffect(() => {
    if (!users.length) return;

    const unsubscribers = users.map((user) =>
      subscribeUserStatus(user.id, ({ isOnline, lastActive }) => {
        setUserStatusMap((prev) => ({
          ...prev,
          [user.id]: { isOnline, lastActive },
        }));
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [users]);

  if (loading) {
    return <p className="admin-info-text">Loading subscribers...</p>;
  }

  return (
    <div className="admin-subscriber-list">
      <h2>My Subscribers</h2>

      {message && <p className="admin-info-text">{message}</p>}

      <ul>
        {users.map((user) => {
          const isOnline = userStatusMap[user.id]?.isOnline;

          return (
            <li
              key={user.id}
              className="subscriber-item"
              onClick={() => navigate(`/subscriber/${user.id}`)}
            >
              <div>
                <strong>{user.name}</strong>
                <div className="subscriber-email">{user.email}</div>
              </div>

              <div className="subscriber-meta">
                <span className="subscriber-role">{user.role}</span>
                <span
                  className={`subscriber-status ${
                    isOnline ? "online" : "offline"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AdminSubscriberList;
