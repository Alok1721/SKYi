import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAward,
  FiCalendar,
  FiCheck,
  FiClock,
  FiImage,
  FiMoon,
  FiSun,
  FiUpload,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { onAuthStateChanged, updatePassword, updateProfile } from "firebase/auth";
import { collection, doc, getCountFromServer, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { uploadToCloudinaryWithMetadata } from "../cloudinaryServices/cloudinary_services";
import { getCurrentTheme, toggleTheme } from "../utils/themeUtils";
import UserStorageQuota from "../components/storage/UserStorageQuota";
import "../styles/userProfilePage.css";

const formatDuration = (totalSeconds = 0) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
};

const formatJoinedDate = (createdAt) => {
  const date = createdAt?.toDate ? createdAt.toDate() : createdAt ? new Date(createdAt) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Not available";
};

const UserProfilePage = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [quizCount, setQuizCount] = useState(null);
  const [quizCountError, setQuizCountError] = useState(false);
  const [theme, setTheme] = useState(getCurrentTheme);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    let unsubscribeProfile = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      const currentRequestId = ++requestId;
      unsubscribeProfile();
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        setError("Sign in to view your profile.");
        return;
      }

      setLoading(true);
      setError("");
      setQuizCount(null);
      setQuizCountError(false);
      let hasInitialProfile = false;
      unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid), (userSnapshot) => {
        if (!active || currentRequestId !== requestId) return;
        const userData = userSnapshot.exists() ? userSnapshot.data() : {};
        setProfile(userData);
        if (!hasInitialProfile) {
          setName(userData.name || currentUser.displayName || "");
          setUsername(userData.username || "");
          setProfilePic(userData.photoURL || currentUser.photoURL || "");
          hasInitialProfile = true;
        }
        setLoading(false);
      }, (loadError) => {
        console.error("Unable to load user profile:", loadError);
        if (active && currentRequestId === requestId) {
          setError("Your profile details could not be loaded. Please try again.");
          setLoading(false);
        }
      });

      try {
        const quizSnapshot = await getCountFromServer(query(
          collection(db, "quizzes"),
          where("solvedBy", "array-contains", currentUser.uid)
        ));
        if (active && currentRequestId === requestId) setQuizCount(quizSnapshot.data().count);
      } catch (loadError) {
        console.error("Unable to load quiz completion analytics:", loadError);
        if (active && currentRequestId === requestId) {
          setQuizCountError(true);
          setQuizCount(null);
        }
      }
    });

    return () => {
      active = false;
      requestId += 1;
      unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => () => {
    if (profilePic.startsWith("blob:")) URL.revokeObjectURL(profilePic);
  }, [profilePic]);

  const handleThemeToggle = () => {
    setTheme(toggleTheme(theme));
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    if (!user) {
      setError("Sign in before updating your profile.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const uploadedPhoto = imageFile
        ? await uploadToCloudinaryWithMetadata(imageFile, "image")
        : null;
      const photoURL = uploadedPhoto?.url || profilePic;
      const updates = {
        name: name.trim(),
        displayName: name.trim(),
        username: username.trim(),
        photoURL,
        ...(uploadedPhoto ? { photoStorageBytes: uploadedPhoto.bytes } : {}),
      };
      await updateDoc(doc(db, "users", user.uid), updates);
      await updateProfile(user, { displayName: name.trim(), photoURL });

      if (newPassword.trim()) {
        await updatePassword(user, newPassword);
        setNewPassword("");
      }

      setProfile((currentProfile) => ({ ...currentProfile, ...updates }));
      setImageFile(null);
      setMessage("Your profile has been updated.");
    } catch (updateError) {
      console.error("Unable to update user profile:", updateError);
      setError(updateError.message || "Your profile could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="user-profile-page"><p className="profile-state">Loading your profile...</p></main>;
  }

  if (!user || error && !profile) {
    return <main className="user-profile-page"><p className="profile-state" role="alert">{error || "Profile unavailable."}</p></main>;
  }

  const subscriptions = Array.isArray(profile?.subscriptions) ? profile.subscriptions : [];
  const accountName = name || user.displayName || "Your profile";

  return (
    <main className="user-profile-page">
      <header className="profile-page-heading">
        <div>
          <p className="profile-eyebrow">ACCOUNT OVERVIEW</p>
          <h1>Your profile</h1>
          <p className="profile-heading-copy">Manage your account and keep track of your learning activity.</p>
        </div>
        <button className="profile-theme-toggle" type="button" onClick={handleThemeToggle}>
          {theme === "dark" ? <FiSun /> : <FiMoon />}
          {theme === "dark" ? "Light theme" : "Dark theme"}
        </button>
      </header>

      {(message || error) && (
        <p className={`profile-feedback ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>
          {error || message}
        </p>
      )}

      <section className="profile-overview-card">
        <div className="profile-identity">
          <div className="profile-avatar-wrap">
            {profilePic ? <img src={profilePic} alt="" className="profile-avatar" /> : <FiUser className="profile-avatar-fallback" />}
          </div>
          <div className="profile-identity-copy">
            <p className="profile-eyebrow">YOUR ACCOUNT</p>
            <h2>{accountName}</h2>
            <p>{user.email || "No email address"}</p>
            <span className="profile-role">{profile?.role || "Learner"}</span>
          </div>
        </div>
        <div className="profile-joined">
          <FiCalendar />
          <span><small>Member since</small><strong>{formatJoinedDate(profile?.createdAt)}</strong></span>
        </div>
      </section>

      <section className="profile-analytics" aria-label="Account analytics">
        <article className="profile-stat-card">
          <span className="profile-stat-icon"><FiClock /></span>
          <div><p>Total time in app</p><strong>{formatDuration(profile?.totalTimeSpentSeconds)}</strong><small>Across signed-in sessions</small></div>
        </article>
        <article className="profile-stat-card">
          <span className="profile-stat-icon"><FiUsers /></span>
          <div><p>Subscriptions</p><strong>{subscriptions.length}</strong><small>{subscriptions.length === 1 ? "active subscription" : "active subscriptions"}</small></div>
        </article>
        <article className="profile-stat-card">
          <span className="profile-stat-icon"><FiAward /></span>
          <div><p>Quizzes completed</p><strong>{quizCountError ? "—" : quizCount ?? "…"}</strong><small>{quizCountError ? "Analytics unavailable" : "Recorded on your account"}</small></div>
        </article>
        <article className="profile-stat-card">
          <span className="profile-stat-icon"><FiImage /></span>
          <div><p>Saved images</p><strong><UserStorageQuota userId={user.uid} valueOnly /></strong><small>In your image library</small></div>
        </article>
      </section>

      <section className="profile-storage-section">
        <div className="profile-section-heading">
          <span className="profile-section-icon"><FiActivity /></span>
          <div><h2>Storage</h2><p>Your image library space</p></div>
        </div>
        <UserStorageQuota userId={user.uid} />
      </section>

      <section className="profile-edit-section">
        <div className="profile-section-heading">
          <span className="profile-section-icon"><FiUser /></span>
          <div><h2>Personal details</h2><p>Update how your account appears to you.</p></div>
        </div>
        <form className="profile-edit-form" onSubmit={handleProfileUpdate}>
          <label className="profile-photo-field">
            <span>Profile photo</span>
            <span className="profile-photo-control">
              <span className="profile-photo-preview">
                {profilePic ? <img src={profilePic} alt="" /> : <FiUser />}
              </span>
              <span className="profile-photo-button"><FiUpload /> Choose an image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    if (profilePic.startsWith("blob:")) URL.revokeObjectURL(profilePic);
                    setImageFile(file);
                    setProfilePic(URL.createObjectURL(file));
                  }
                  event.target.value = "";
                }}
              />
            </span>
          </label>

          <div className="profile-form-grid">
            <label>
              Display name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={80} />
            </label>
            <label>
              Username
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" maxLength={40} />
            </label>
            <label>
              Email address
              <input type="email" value={user.email || ""} readOnly />
            </label>
            <label>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Leave blank to keep your password"
                autoComplete="new-password"
                minLength={6}
              />
            </label>
          </div>

          <div className="profile-form-footer">
            <p><FiCheck /> Your email address is managed by your sign-in provider.</p>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default UserProfilePage;
