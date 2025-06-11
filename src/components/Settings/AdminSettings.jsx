// AdminSettings.jsx
import React, { useState, useEffect } from "react";
import { THEMES, getCurrentTheme, setTheme } from "../../utils/themeUtils";
import "./AdminSettings.css"; // Updated CSS file
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import LoadingScreen from "../loadingScreen/LoadingScreen";

const AdminSettings = () => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
  const [examName, setExamName] = useState("");
  const [examOptions, setExamOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "exam_details"));
        const exams = querySnapshot.docs.map((doc) => doc.id);
        setExamOptions(exams);

        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setExamName(userDocSnap.data().examName || "");
          }
        } else {
          setError("No authenticated user found.");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setError("Failed to load settings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
    setTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeToggle = () => {
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setCurrentTheme(newTheme);
  };

  const handleSaveExam = async () => {
    if (!examName) {
      setError("Please select an exam.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { examName: examName });
        setSuccessMessage("Default exam saved successfully!");
        setError("");
      } else {
        setError("User not authenticated.");
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      setError("Failed to save exam. Please try again.");
      setSuccessMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading admin settings..." />;
  }

  return (
    <div className="admin-settings-container">
      <h1 className="admin-settings-title">Admin Settings</h1>

      <div className="admin-settings-section">
        <h2>Appearance</h2>
        <div className="admin-theme-toggle">
          <span>Dark Mode</span>
          <label className="admin-theme-switch">
            <input
              type="checkbox"
              checked={currentTheme === THEMES.DARK}
              onChange={handleThemeToggle}
            />
            <span className="admin-slider round"></span>
          </label>
        </div>
      </div>

      <div className="admin-settings-section">
        <h2>Exam Settings</h2>
        {error && <p className="admin-error">{error}</p>}
        {successMessage && <p className="admin-success">{successMessage}</p>}

        <div className="admin-form-group">
          <label>Select Default Exam:</label>
          <select
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="admin-exam-select"
          >
            <option value="">Select an exam</option>
            {examOptions.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSaveExam}
          className="admin-save-btn"
          disabled={isLoading}
        >
          Save Exam
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
