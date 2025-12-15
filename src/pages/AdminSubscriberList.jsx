import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/adminSubscriberList.css";

const AdminSubscriberList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscribedUsers = async () => {
      try {
        const adminId = auth.currentUser?.uid;

        if (!adminId) {
          setMessage("Admin not authenticated.");
          setLoading(false);
          return;
        }

        // 1️⃣ Fetch admin document
        const adminSnap = await getDoc(doc(db, "users", adminId));

        if (!adminSnap.exists()) {
          setMessage("Admin profile not found.");
          setLoading(false);
          return;
        }

        const { subscribedUsers = [] } = adminSnap.data();

        // 2️⃣ If no subscribers
        if (subscribedUsers.length === 0) {
          setMessage("No users have subscribed to you yet.");
          setUsers([]);
          setLoading(false);
          return;
        }

        // 3️⃣ Fetch only subscribed users
        // Firestore 'in' supports max 10 → chunk if needed
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("__name__", "in", subscribedUsers.slice(0, 10)));

        const snap = await getDocs(q);
        const userList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setUsers(userList);
      } catch (error) {
        console.error("Error fetching subscribers:", error);
        setMessage("Failed to load subscribers.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribedUsers();
  }, []);

  if (loading) {
    return <p className="admin-info-text">Loading subscribers...</p>;
  }

  return (
    <div className="admin-subscriber-list">
      <h2>My Subscribers</h2>

      {message && <p className="admin-info-text">{message}</p>}

      <ul>
        {users.map((user) => (
          <li
            key={user.id}
            className="subscriber-item"
            onClick={() => navigate(`/subscriber/${user.id}`)}
          >
            <div>
              <strong>{user.name}</strong>
              <div className="subscriber-email">{user.email}</div>
            </div>
            <span className="subscriber-role">{user.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminSubscriberList;
