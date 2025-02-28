import React, { useState, useEffect } from "react";
import "../styles/userProfilePage.css";
import { auth, db } from "../firebaseConfig";
import { updateProfile, updatePassword } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { data } from "react-router-dom";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfjudeatw/image/upload"; 
const UPLOAD_PRESET = "dp_url"; // Replace with your Cloudinary preset name

const UserProfilePage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [profilePic, setProfilePic] = useState("https://via.placeholder.com/150");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [doj, setDOJ] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    // console.log("current user:",currentUser.uid);
    if (currentUser) {
      setUser(currentUser);
      setEmail(currentUser.email);
      setName(currentUser.displayName || "");
      setProfilePic(currentUser.photoURL || "https://via.placeholder.com/150");

      const fetchUserData = async () => {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || "");
          setRole(userDoc.data().role ||"Anyonmous");
            setDOJ(userDoc.data().createdAt ?new Date(userDoc.data().createdAt.seconds * 1000).toLocaleDateString() : "Not Available");
        }
      };
      fetchUserData();
    }
  }, []);

  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Upload Error:", error);
      return null;
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) return alert("User not logged in");

    setLoading(true);
    try {
      let photoURL = profilePic;

      if (imageFile) {
        const uploadedURL = await uploadToCloudinary(imageFile);
        if (!uploadedURL) throw new Error("Failed to upload image");
        photoURL = uploadedURL;
      }

      await updateDoc(doc(db, "users", user.uid), {
        username,
        displayName: name,
        photoURL,
      });

      await updateProfile(user, { displayName: name, photoURL });

      if (newPassword.trim()) {
        await updatePassword(user, newPassword);
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`profile-container ${darkMode ? "dark" : ""}`}>
      <div className="profile-header">
        <img src={profilePic} alt="Profile" className="profile-picture" />
        <h2 className="profile-name">{name}</h2>
        <p className="profile-username">@{username}</p>
      </div>

      <div className="profile-details">
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Role:</strong> {role??"Anyonmous"}</p>
        <p><strong>Date of Joining:</strong> {doj??Date.now()}</p>
      </div>

      <div className="profile-stats">
        <div className="stat-card"><h3>🔥 Success Streak</h3><p>25 days</p></div>
        <div className="stat-card"><h3>⏳ Total Time Spent</h3><p>120 hrs</p></div>
        <div className="stat-card"><h3>💾 Saved Questions</h3><p>48</p></div>
        <div className="stat-card"><h3>👥 Followed Friends</h3><p>15</p></div>
        <div className="stat-card"><h3>📌 Bookmarked Questions</h3><p>32</p></div>
      </div>

      <div className="update-profile">
        <h3>🛠️ Update Profile</h3>
        <form onSubmit={handleProfileUpdate}>
          <label>Profile Picture:</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />

          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Name" />

          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter Username" />

          <label>Email:</label>
          <input type="email" value={email} readOnly />

          <label>New Password:</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter New Password" />

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>

      <div className="profile-settings">
        <h3>⚙️ Settings</h3>
        <div className="settings-option">
          <label>Dark Mode</label>
          <button onClick={handleToggleTheme}>{darkMode ? "Light Mode" : "Dark Mode"}</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
