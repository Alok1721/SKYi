// AdminSettings.jsx
import React, { useEffect, useState } from "react";
import {
  fetchAllExams,
  fetchExamDetails,
  createExam,
  updateExamDate,
  addSubjectToExam,
} from "../../firebaseServices/exam_details";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";
import { THEMES, getCurrentTheme, setTheme } from "../../utils/themeUtils";
import LoadingScreen from "../loadingScreen/LoadingScreen";
import "./AdminSettings.css";

const AdminSettings = () => {
  // Theme
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  // Exams
  const [examOptions, setExamOptions] = useState([]);
  const [examName, setExamName] = useState("");

  // Add exam
  const [newExamName, setNewExamName] = useState("");
  const [isAddingExam, setIsAddingExam] = useState(false);

  // Update exam
  const [selectedExamForUpdate, setSelectedExamForUpdate] = useState("");
  const [examDate, setExamDate] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [currentSubjects, setCurrentSubjects] = useState([]);
  const [isUpdatingExam, setIsUpdatingExam] = useState(false);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Playlist management
const [playlists, setPlaylists] = useState([]);
const [selectedPlaylist, setSelectedPlaylist] = useState(null);

const [playlistName, setPlaylistName] = useState("");
const [playlistType, setPlaylistType] = useState("");

const [newPlaylistName, setNewPlaylistName] = useState("");
const [newPlaylistType, setNewPlaylistType] = useState("");


  // ---------------- FETCH INITIAL DATA ----------------
  useEffect(() => {
  const fetchSettings = async () => {
    try {
      const exams = await fetchAllExams();
      setExamOptions(exams);

      const user = auth.currentUser;
      if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          setExamName(userSnap.data().examName || "");
        }
      }
    } catch (err) {
      console.error("fetchSettings error:", err);
      setError("Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchSettings();
  setTheme(currentTheme);
}, [currentTheme]);


  // ---------------- FETCH SELECTED EXAM DETAILS ----------------
  useEffect(() => {
  if (!selectedExamForUpdate) return;

  const loadExamDetails = async () => {
    try {
      const data = await fetchExamDetails(selectedExamForUpdate);
      if (!data) return;

      setCurrentSubjects(data.subject || []);
      setExamDate(
        data.examDate
          ? new Date(data.examDate.seconds * 1000)
              .toISOString()
              .split("T")[0]
          : ""
      );
    } catch (err) {
      console.error(err);
    }
  };

  loadExamDetails();
}, [selectedExamForUpdate]);


  // ---------------- HANDLERS ----------------

  const handleThemeToggle = () => {
    setCurrentTheme(
      currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    );
  };

  const handleSaveExam = async () => {
    if (!examName) {
      setError("Please select an exam.");
      return;
    }

    try {
      setIsLoading(true);
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        examName,
      });
      setSuccessMessage("Default exam saved!");
      setError("");
    } catch (err) {
      setError("Failed to save exam.");
    } finally {
      setIsLoading(false);
    }
  };

const handleAddNewExam = async () => {
  const name = newExamName.trim();
  if (!name) return setError("Exam name cannot be empty.");
  if (examOptions.includes(name)) return setError("Exam already exists.");

  try {
    setIsAddingExam(true);
    await createExam(name);

    setExamOptions((prev) => [...prev, name]);
    setExamName(name);
    setNewExamName("");
    setSuccessMessage("Exam created successfully!");
    setError("");
  } catch {
    setError("Failed to create exam.");
  } finally {
    setIsAddingExam(false);
  }
};


  const handleAddSubject = async () => {
  if (!newSubject.trim() || !selectedExamForUpdate) return;
  if (currentSubjects.includes(newSubject))
    return setError("Subject already exists.");

  try {
    setIsUpdatingExam(true);
    await addSubjectToExam(selectedExamForUpdate, newSubject);

    setCurrentSubjects((prev) => [...prev, newSubject]);
    setNewSubject("");
    setSuccessMessage("Subject added successfully!");
    setError("");
  } catch {
    setError("Failed to add subject.");
  } finally {
    setIsUpdatingExam(false);
  }
};


 const handleUpdateExamDate = async () => {
  if (!examDate || !selectedExamForUpdate) return;

  try {
    setIsUpdatingExam(true);
    await updateExamDate(selectedExamForUpdate, examDate);

    setSuccessMessage("Exam date updated!");
    setError("");
  } catch {
    setError("Failed to update exam date.");
  } finally {
    setIsUpdatingExam(false);
  }
};


  // ---------------- UI ----------------
  if (isLoading) {
    return <LoadingScreen message="Loading admin settings..." />;
  }

  return (
    <div className="admin-settings-container">
      <h1 className="admin-settings-title">Admin Settings</h1>

      {/* Appearance */}
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

      {/* Exam Settings */}
      <div className="admin-settings-section">
        <h2>Exam Settings</h2>

        {error && <p className="admin-error">{error}</p>}
        {successMessage && (
          <p className="admin-success">{successMessage}</p>
        )}

        <div className="admin-form-group">
          <label>Select Default Exam</label>
          <select
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="admin-exam-select"
          >
            <option value="">Select exam</option>
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
        >
          Save Exam
        </button>
      </div>

      {/* Add Exam */}
      <div className="admin-settings-section">
        <h2>Add New Exam</h2>

        <div className="admin-form-group">
          <label>Exam Name</label>
          <input
            type="text"
            value={newExamName}
            onChange={(e) => setNewExamName(e.target.value)}
            placeholder="Enter exam name"
            className="admin-exam-select"
          />
        </div>

        <button
          onClick={handleAddNewExam}
          className="admin-save-btn"
          disabled={isAddingExam}
        >
          Add Exam
        </button>
      </div>

      {/* Update Exam */}
      <div className="admin-settings-section">
        <h2>Update Exam</h2>

        <div className="admin-form-group">
          <label>Select Exam</label>
          <select
            value={selectedExamForUpdate}
            onChange={(e) =>
              setSelectedExamForUpdate(e.target.value)
            }
            className="admin-exam-select"
          >
            <option value="">Select exam</option>
            {examOptions.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-group">
          <label>Exam Date</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="admin-exam-select"
          />
          <button
            onClick={handleUpdateExamDate}
            className="admin-save-btn"
            disabled={isUpdatingExam}
          >
            Update Exam Date
          </button>
        </div>

        <div className="admin-form-group">
          <label>Add Subject</label>
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Enter subject name"
            className="admin-exam-select"
          />
          <button
            onClick={handleAddSubject}
            className="admin-save-btn"
            disabled={isUpdatingExam}
          >
            Add Subject
          </button>
        </div>

        {currentSubjects.length > 0 && (
          <div className="admin-form-group">
            <label>Current Subjects</label>
            <ul>
              {currentSubjects.map((sub, idx) => (
                <li key={idx}>{sub}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
