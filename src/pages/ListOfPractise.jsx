import React, { useEffect, useState } from "react";
import "../styles/listOfPractise.css";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { FiBarChart2, FiX } from 'react-icons/fi';
import AnalyticsCharts from '../components/analytics/AnalyticsCharts';

const ListOfPractise = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions } = location.state || { questions: [] };
  const [filteredQuestions, setFilteredQuestions] = useState(questions);
  const [filter, setFilter] = useState("all");
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    monthlyStats: [],
    completionStats: []
  });

  // ... existing useEffect and other functions ...

  return (
    <div className="list-of-practise">
      <div className="header-section">
        <h2>Practice Questions</h2>
        <button 
          className="analytics-toggle"
          onClick={() => setShowAnalytics(!showAnalytics)}
        >
          {showAnalytics ? <FiX /> : <FiBarChart2 />}
        </button>
      </div>

      {showAnalytics && (
        <AnalyticsCharts
          monthlyStats={analyticsData.monthlyStats}
          completionStats={analyticsData.completionStats}
          title="Question Analytics"
        />
      )}

      <div className="filter-options">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "solved" ? "active" : ""}
          onClick={() => setFilter("solved")}
        >
          Solved
        </button>
        <button
          className={filter === "unsolved" ? "active" : ""}
          onClick={() => setFilter("unsolved")}
        >
          Unsolved
        </button>
      </div>

      {Object.entries(sortedGroupedQuestions).map(([groupName, questionsInGroup]) => (
        <div key={groupName} className="question-section">
          <h3 className="section-title">{formatGroupName(groupName)}</h3>
          <div className="question-grid">
            {questionsInGroup.map((question) => (
              <div
                key={question.id}
                className={`question-card ${question.solvedBy?.includes(currentUserId) ? "solved" : ""}`}
                onClick={() => handleQuestionClick(question)}
              >
                <div className="question-content">
                  <h3 title={question.title}>{truncateText(question.title, 30)}</h3>
                  <div className="question-meta">
                    <span className="subject">{question.subject}</span>
                    <span className="tags">{question.tags.join(", ")}</span>
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
        </div>
      ))}
    </div>
  );
};

export default ListOfPractise;