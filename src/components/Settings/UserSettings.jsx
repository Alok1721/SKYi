
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getCurrentUser } from '../../firebaseServices/current_user';
import { FiSun, FiMoon } from 'react-icons/fi';
import { THEMES, getCurrentTheme, setTheme } from '../../utils/themeUtils';
import { useExam } from '../../contexts/ExamContext';
import './UserSettings.css';


const UserSettings = () => {
  const { examName, setExamName } = useExam();
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch exams and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const user = await getCurrentUser();
        if (user && user.examName) {
          setExamName(user.examName);
          localStorage.setItem('examName', user.examName);
        }

        // Fetch exams from exam_details
        const examsRef = collection(db, 'exam_details');
        const examsSnapshot = await getDocs(examsRef);
        const examList = examsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id // Fallback to doc ID if name is missing
        }));
        setExams(examList);
      } catch (err) {
        setError('Failed to load exams. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle theme toggle
  useEffect(() => {
    setTheme(currentTheme);
    document.documentElement.style.backgroundColor = currentTheme === THEMES.DARK ? '#1a1a1a' : '#ffffff';
  }, [currentTheme]);

  const handleThemeToggle = () => {
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setCurrentTheme(newTheme);
  };

  // Handle exam selection
  const handleExamChange = async (e) => {
    const newExam = e.target.value;
    setExamName(newExam);
    localStorage.setItem('examName', newExam);

    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        await updateDoc(doc(db, 'users', userId), { examName: newExam });
        console.log(`Updated examName to ${newExam} for user ${userId}`);
      }
    } catch (err) {
      setError('Failed to save exam selection. Please try again.');
      console.error('Error updating examName:', err);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
        <h1>Settings</h1>
        {error && <div className="error-message">{error}</div>}
        <div className="settings-section">
          <h2>Appearance</h2>
          <div className="theme-toggle-container">
            <div className="theme-info">
              <span className="theme-icon">
                {currentTheme === THEMES.DARK ? <FiMoon /> : <FiSun />}
              </span>
              <div className="theme-text">
                <span className="theme-label">
                  {currentTheme === THEMES.DARK ? 'Dark Mode' : 'Light Mode'}
                </span>
                <p className="theme-description">
                  Switch between light and dark theme
                </p>
              </div>
            </div>
            <label className="theme-switch">
              <input
                type="checkbox"
                checked={currentTheme === THEMES.DARK}
                onChange={handleThemeToggle}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        <div className="settings-section">
          <h2>Exam Selection</h2>
          <div className="exam-selection-container">
            <div className="exam-info">
              <span className="exam-label">Selected Exam</span>
              <p className="exam-description">
                Choose the exam to view relevant content
              </p>
            </div>
            {loading ? (
              <p>Loading exams...</p>
            ) : (
              <select
                value={examName}
                onChange={handleExamChange}
                className="exam-selector"
                disabled={exams.length === 0}
              >
                {exams.length === 0 ? (
                  <option value="">No exams available</option>
                ) : (
                  exams.map((exam) => (
                    <option key={exam.id} value={exam.name}>
                      {exam.name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
