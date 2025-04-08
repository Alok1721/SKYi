import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/listOfPractise.css";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { FiBarChart2, FiX } from 'react-icons/fi';
import AnalyticsCharts from '../components/analytics/AnalyticsCharts';
import { truncateText, formatGroupName } from '../utils/textUtils';

const ListOfPractises = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playlistId, type, questions, userId } = location.state || { playlistId: null, type: "Unknown", questions: [], userId: null };

  const [questionList, setQuestionList] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'attempted', 'unattempted'
  const [analyticsData, setAnalyticsData] = useState({
    monthlyStats: [],
    completionStats: []
  });
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (questions?.length) {
          setQuestionList(questions);
        } else if (playlistId) {
          const playlistDoc = await getDoc(doc(db, "playlists", playlistId));
          if (playlistDoc.exists()) {
            const questionIds = playlistDoc.data().questions || [];

            const questionPromises = questionIds.map(async (id) => {
              const questionDoc = await getDoc(doc(db, "questions", id));
              return questionDoc.exists() ? { id, ...questionDoc.data() } : null;
            });

            const fetchedQuestions = (await Promise.all(questionPromises)).filter((q) => q !== null);
            setQuestionList(fetchedQuestions);
          }
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, [playlistId, questions]);

  useEffect(() => {
    const calculateAnalytics = () => {
      const monthlyData = {};
      let totalSolved = 0;
      let totalUnsolved = 0;

      questionList.forEach(question => {
        let date;
        try {
          // Handle different date formats
          if (question.createdAt?.toDate) {
            // Firestore Timestamp
            date = question.createdAt.toDate();
          } else if (question.createdAt instanceof Date) {
            // JavaScript Date object
            date = question.createdAt;
          } else if (typeof question.createdAt === 'string') {
            // ISO string
            date = new Date(question.createdAt);
          } else {
            // If no valid date, use current date
            date = new Date();
          }

          const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          const isSolved = question.solvedBy?.includes(currentUserId);
          
          if (!monthlyData[month]) {
            monthlyData[month] = {
              month,
              solved: 0,
              unsolved: 0,
              total: 0
            };
          }
          monthlyData[month].total++;
          if (isSolved) {
            monthlyData[month].solved++;
            totalSolved++;
          } else {
            monthlyData[month].unsolved++;
            totalUnsolved++;
          }
        } catch (error) {
          console.error('Error processing question date:', error);
          // Use current date as fallback
          const month = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
          if (!monthlyData[month]) {
            monthlyData[month] = {
              month,
              solved: 0,
              unsolved: 0,
              total: 0
            };
          }
          monthlyData[month].total++;
          if (question.solvedBy?.includes(currentUserId)) {
            monthlyData[month].solved++;
            totalSolved++;
          } else {
            monthlyData[month].unsolved++;
            totalUnsolved++;
          }
        }
      });

      const monthlyStats = Object.values(monthlyData).sort((a, b) => {
        const [monthA, yearA] = a.month.split(" ");
        const [monthB, yearB] = b.month.split(" ");
        const yearCompare = parseInt(yearB) - parseInt(yearA);
        if (yearCompare !== 0) return yearCompare;
        return new Date(monthB + " 1, 2000").getTime() - new Date(monthA + " 1, 2000").getTime();
      });

      const completionStats = [
        { name: 'Solved', value: totalSolved },
        { name: 'Unsolved', value: totalUnsolved }
      ];

      setAnalyticsData({
        monthlyStats,
        completionStats
      });
    };

    if (questionList.length > 0) {
      calculateAnalytics();
    }
  }, [questionList, currentUserId]);

  const handleQuestionClick = (question) => {
    navigate("/testZone", { state: { questions: [question], quizId: question.id, isQuiz: question.isQuiz, quizData: question, collectionName: "questions", collectionId: question.id } });
  };

  const uniqueTags = [...new Set(questionList.flatMap((q) => q.tags || []))];

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const filteredQuestions = questionList.filter(question => {
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every((tag) => question.tags?.includes(tag));
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'attempted' && question.solvedBy?.includes(currentUserId)) ||
      (statusFilter === 'unattempted' && !question.solvedBy?.includes(currentUserId));
    
    return matchesTags && matchesStatus;
  });

  const COLORS = {
    light: {
      solved: '#4CAF50',
      unsolved: '#FF5252',
      text: '#000000',
      grid: '#E0E0E0'
    },
    dark: {
      solved: '#66BB6A',
      unsolved: '#FF6B6B',
      text: '#FFFFFF',
      grid: '#424242'
    }
  };

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const currentColors = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <div className="list-of-practises">
      <div className="header-section">
        <h2>{type} Questions</h2>
        <button 
          className="analytics-toggle"
          onClick={() => setShowAnalytics(!showAnalytics)}
        >
          <FiBarChart2 /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>

      {showAnalytics && (
        <div className="analytics-section">
          <div className="chart-container">
            <h3>Monthly Progress</h3>
            <div className="chart-wrapper">
              <BarChart
                width={500}
                height={300}
                data={analyticsData.monthlyStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={currentColors.grid} />
                <XAxis 
                  dataKey="month" 
                  stroke={currentColors.text}
                  tick={{ fill: currentColors.text }}
                />
                <YAxis 
                  stroke={currentColors.text}
                  tick={{ fill: currentColors.text }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#424242' : '#FFFFFF',
                    border: `1px solid ${currentColors.grid}`,
                    color: currentColors.text
                  }}
                  labelStyle={{ color: currentColors.text }}
                />
                <Legend 
                  wrapperStyle={{ color: currentColors.text }}
                />
                <Bar dataKey="solved" name="Solved" fill={currentColors.solved} />
                <Bar dataKey="unsolved" name="Unsolved" fill={currentColors.unsolved} />
              </BarChart>
            </div>
          </div>

          <div className="chart-container">
            <h3>Overall Completion</h3>
            <div className="chart-wrapper">
              <PieChart width={400} height={300}>
                <Pie
                  data={analyticsData.completionStats}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.completionStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? currentColors.solved : currentColors.unsolved} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#424242' : '#FFFFFF',
                    border: `1px solid ${currentColors.grid}`,
                    color: currentColors.text
                  }}
                  labelStyle={{ color: currentColors.text }}
                />
                <Legend 
                  wrapperStyle={{ color: currentColors.text }}
                />
              </PieChart>
            </div>
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="tag-filter">
          <label>Filter by Tags:</label>
          <div className="tag-buttons">
            {uniqueTags.map((tag, index) => (
              <button
                key={index}
                className={`tag-button ${selectedTags.includes(tag) ? "active" : ""}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="status-filter">
          <label>Filter by Status:</label>
          <div className="status-buttons">
            <button
              className={`status-button ${statusFilter === 'all' ? "active" : ""}`}
              onClick={() => handleStatusFilter('all')}
            >
              All
            </button>
            <button
              className={`status-button ${statusFilter === 'attempted' ? "active" : ""}`}
              onClick={() => handleStatusFilter('attempted')}
            >
              Attempted
            </button>
            <button
              className={`status-button ${statusFilter === 'unattempted' ? "active" : ""}`}
              onClick={() => handleStatusFilter('unattempted')}
            >
              Unattempted
            </button>
          </div>
        </div>
      </div>

      {filteredQuestions.length > 0 ? (
        <div className="question-grid">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className={`question-card ${question.solvedBy?.includes(currentUserId) ? "solved" : "unsolved"}`}
              onClick={() => handleQuestionClick(question)}
            >
              <div className="question-content">
                <h3 title={question.question}>{truncateText(question.question, 30)}</h3>
                <div className="question-meta">
                  <span className="subject">{question.subject || "Unknown"}</span>
                  <span className="tags">{question.tags?.join(", ") || "No tags"}</span>
                </div>
                <div className="question-status">
                  {question.solvedBy?.includes(currentUserId) ? "Solved" : "Unsolved"}
                </div>
              </div>
              <div className="question-icon">
                {question.solvedBy?.includes(currentUserId) ? "✓" : "?"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-questions">No questions found.</p>
      )}
    </div>
  );
};

export default ListOfPractises;