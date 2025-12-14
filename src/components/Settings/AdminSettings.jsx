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
  fetchPlaylistsByExam,
  createPlaylist,
  updatePlaylist,
} from "../../firebaseServices/playlist";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { THEMES, getCurrentTheme, setTheme } from "../../utils/themeUtils";
import LoadingScreen from "../loadingScreen/LoadingScreen";
import "./AdminSettings.css";

/* ---------------------------------------------------
   Reusable Collapsible Section
--------------------------------------------------- */
const AdminSection = ({ title, isOpen, onToggle, children }) => {
  return (
    <div className="admin-settings-section">
      <div className="admin-section-header" onClick={onToggle}>
        <h2>{title}</h2>
        <span className="admin-section-toggle">{isOpen ? "−" : "+"}</span>
      </div>

      {isOpen && <div className="admin-section-content">{children}</div>}
    </div>
  );
};

const AdminSettings = () => {
  /* ---------------- Theme ---------------- */
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  /* ---------------- Exams ---------------- */
  const [examOptions, setExamOptions] = useState([]);
  const [examName, setExamName] = useState("");

  const [newExamName, setNewExamName] = useState("");
  const [selectedExamForUpdate, setSelectedExamForUpdate] = useState("");
  const [examDate, setExamDate] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [currentSubjects, setCurrentSubjects] = useState([]);

  /* ---------------- Playlists ---------------- */
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistType, setPlaylistType] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistType, setNewPlaylistType] = useState("");

  /* ---------------- UI ---------------- */
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* ---------------- Section Control ---------------- */
  const [openSection, setOpenSection] = useState("general");
  const toggleSection = (key) =>
    setOpenSection((prev) => (prev === key ? "" : key));

  /* ---------------- Initial Load ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        const exams = await fetchAllExams();
        setExamOptions(exams);

        const user = auth.currentUser;
        if (user) {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) setExamName(snap.data().examName || "");
        }
      } catch {
        setError("Failed to load settings.");
      } finally {
        setIsLoading(false);
      }
    };

    init();
    setTheme(currentTheme);
  }, [currentTheme]);

  /* ---------------- Load Exam Details ---------------- */
  useEffect(() => {
    if (!selectedExamForUpdate) return;

    const load = async () => {
      const data = await fetchExamDetails(selectedExamForUpdate);
      if (!data) return;

      setCurrentSubjects(data.subject || []);
      setExamDate(
        data.examDate
          ? new Date(data.examDate.seconds * 1000).toISOString().split("T")[0]
          : ""
      );

      const pl = await fetchPlaylistsByExam(selectedExamForUpdate);
      setPlaylists(pl);
    };

    load();
  }, [selectedExamForUpdate]);

  /* ---------------- Handlers ---------------- */
  const handleThemeToggle = () =>
    setCurrentTheme(
      currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
    );

  const handleSaveExam = async () => {
    if (!examName) return setError("Select an exam.");
    await updateDoc(doc(db, "users", auth.currentUser.uid), { examName });
    setSuccessMessage("Default exam saved!");
  };

  const handleAddExam = async () => {
    if (!newExamName.trim()) return;
    await createExam(newExamName);
    setExamOptions((p) => [...p, newExamName]);
    setNewExamName("");
    setSuccessMessage("Exam created!");
  };

  const handleUpdateDate = async () => {
    await updateExamDate(selectedExamForUpdate, examDate);
    setSuccessMessage("Exam date updated!");
  };

  const handleAddSubjectClick = async () => {
    await addSubjectToExam(selectedExamForUpdate, newSubject);
    setCurrentSubjects((p) => [...p, newSubject]);
    setNewSubject("");
    setSuccessMessage("Subject added!");
  };

  const handleUpdatePlaylist = async () => {
    await updatePlaylist(selectedPlaylist.id, {
      name: playlistName,
      type: playlistType,
    });
    setSuccessMessage("Playlist updated!");
  };

  const handleAddPlaylist = async () => {
    await createPlaylist({
      name: newPlaylistName,
      type: newPlaylistType,
      examName: selectedExamForUpdate,
    });
    setPlaylists(await fetchPlaylistsByExam(selectedExamForUpdate));
    setNewPlaylistName("");
    setNewPlaylistType("");
    setSuccessMessage("Playlist added!");
  };

  if (isLoading) return <LoadingScreen message="Loading Admin Settings..." />;

  return (
    <div className="admin-settings-container">
      <h1 className="admin-settings-title">Admin Settings</h1>

      {error && <p className="admin-error">{error}</p>}
      {successMessage && <p className="admin-success">{successMessage}</p>}

      {/* GENERAL */}
      <AdminSection
        title="General Settings"
        isOpen={openSection === "general"}
        onToggle={() => toggleSection("general")}
      >
        <div className="admin-theme-toggle">
          <span>Dark Mode</span>
          <label className="admin-theme-switch">
            <input
              type="checkbox"
              checked={currentTheme === THEMES.DARK}
              onChange={handleThemeToggle}
            />
            <span className="admin-slider round" />
          </label>
        </div>

        <select
          className="admin-exam-select"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
        >
          <option value="">Select Default Exam</option>
          {examOptions.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>

        <button className="admin-save-btn" onClick={handleSaveExam}>
          Save Default Exam
        </button>
      </AdminSection>

      {/* EXAM MANAGEMENT */}
      <AdminSection
        title="Exam Management"
        isOpen={openSection === "exam"}
        onToggle={() => toggleSection("exam")}
      >
        <input
          className="admin-exam-select"
          placeholder="New Exam Name"
          value={newExamName}
          onChange={(e) => setNewExamName(e.target.value)}
        />
        <button className="admin-save-btn" onClick={handleAddExam}>
          Add Exam
        </button>

        <hr />

        <select
          className="admin-exam-select"
          value={selectedExamForUpdate}
          onChange={(e) => setSelectedExamForUpdate(e.target.value)}
        >
          <option value="">Select Exam to Update</option>
          {examOptions.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>

        {selectedExamForUpdate && (
          <>
            <input
              type="date"
              className="admin-exam-select"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
            <button className="admin-save-btn" onClick={handleUpdateDate}>
              Update Date
            </button>

            <input
              className="admin-exam-select"
              placeholder="New Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <button
              className="admin-save-btn"
              onClick={handleAddSubjectClick}
            >
              Add Subject
            </button>
          </>
        )}
      </AdminSection>

      {/* PLAYLIST MANAGEMENT */}
      <AdminSection
        title="Playlist Management"
        isOpen={openSection === "playlist"}
        onToggle={() => toggleSection("playlist")}
      >
        {!selectedExamForUpdate && <p>Select an exam first.</p>}

        {selectedExamForUpdate && (
          <>
            <div className="playlist-grid">
              {playlists.map((p) => (
                <div
                  key={p.id}
                  className={`playlist-card ${
                    selectedPlaylist?.id === p.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedPlaylist(p);
                    setPlaylistName(p.name);
                    setPlaylistType(p.type || "");
                  }}
                >
                  <strong>{p.name}</strong>
                  <span>{p.type}</span>
                </div>
              ))}
            </div>

            {selectedPlaylist && (
              <>
                <input
                  className="admin-exam-select"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                />
                <input
                  className="admin-exam-select"
                  value={playlistType}
                  onChange={(e) => setPlaylistType(e.target.value)}
                />
                <button
                  className="admin-save-btn"
                  onClick={handleUpdatePlaylist}
                >
                  Update Playlist
                </button>
              </>
            )}

            <hr />

            <input
              className="admin-exam-select"
              placeholder="New Playlist Name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
            />
            <input
              className="admin-exam-select"
              placeholder="Playlist Type"
              value={newPlaylistType}
              onChange={(e) => setNewPlaylistType(e.target.value)}
            />
            <button className="admin-save-btn" onClick={handleAddPlaylist}>
              Add Playlist
            </button>
          </>
        )}
      </AdminSection>
    </div>
  );
};

export default AdminSettings;
