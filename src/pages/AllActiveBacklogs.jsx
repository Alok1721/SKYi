import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig"; // Adjust path based on your project structure
import { collection, query, getDocs, getDoc, doc, where } from "firebase/firestore";
import "../styles/allActiveBacklogs.css"; // Import CSS file
import { useNavigate } from 'react-router-dom';
import QuizCard from "../components/quiz/quizCard";
import { fetchActiveBacklogs, fetchQuizById } from "../firebaseServices/quiz_services";
import { THEMES, getCurrentTheme } from "../utils/themeUtils";
import { useExam } from '../contexts/ExamContext';

const AllActiveBacklogs = () => {
  const { examName } = useExam();
  const [quizzesByDate, setQuizzesByDate] = useState({});
  const navigate = useNavigate();
  const currentTheme = getCurrentTheme();

  useEffect(() => {
    // Update root background color based on theme
    document.documentElement.style.backgroundColor = currentTheme === THEMES.DARK ? '#1a1a1a' : '#ffffff';
  }, [currentTheme]);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        let groupedQuizzes = await fetchActiveBacklogs(examName);
        setQuizzesByDate(groupedQuizzes);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };

    loadQuizzes();
  }, []);

  const handleStartQuiz = async (quizId) => {
    try {
      const quizData = await fetchQuizById(quizId,examName);
      if (quizData) {
        navigate("/testZone", { 
          state: { 
            questions: quizData.questions,
            quizId: quizId,
            isQuiz: quizData.isQuiz,
            quizData: quizData
          } 
        });
      } else {
        alert("Quiz not found!");
      }
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      alert("Failed to load questions.");
    }
  };
    
  return (
    <div className="backlogs-page">
      <div className="backlogs-content">
        {Object.keys(quizzesByDate).map((date) => (
          <div key={date} className="quiz-section">
            <h2 className="quiz-date">{date}</h2>
            <div className="quiz-grid">
              {quizzesByDate[date].map((quiz) => (
                <QuizCard 
                  key={quiz.id} 
                  quiz={quiz} 
                  handleStartQuiz={handleStartQuiz} 
                />
              ))}
            </div>
          </div>
        ))}   
      </div>
    </div>
  );
};

export default AllActiveBacklogs;
