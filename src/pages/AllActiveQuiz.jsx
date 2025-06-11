import React, { useEffect, useState } from "react";
import "../styles/allActiveQuiz.css"; // Import CSS file
import { useNavigate } from 'react-router-dom';
import QuizCard from "../components/quiz/quizCard";
import { fetchQuizzesByDate, fetchQuizById } from "../firebaseServices/quiz_services";
import { FiLoader } from 'react-icons/fi';
import { useExam } from '../contexts/ExamContext';

const QuizzesList = () => {
  const { examName } = useExam();
  const [quizzesByDate, setQuizzesByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        const groupedQuizzes = await fetchQuizzesByDate(examName);
        setQuizzesByDate(groupedQuizzes);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setError("Failed to load quizzes. Please try again later.");
      } finally {
        setLoading(false);
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
        setError("Quiz not found!");
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      setError("Failed to start quiz. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="all-quiz-container">
        <div className="loading-state">
          <FiLoader className="loading-spinner" />
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-quiz-container">
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (Object.keys(quizzesByDate).length === 0) {
    return (
      <div className="all-quiz-container">
        <div className="empty-state">
          <p>No quizzes available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="all-quiz-container">
      {Object.keys(quizzesByDate).map((date) => (
        <div key={date} className="all-quiz-quiz-section">
          <h2 className="all-quiz-quiz-date">{date}</h2>
          <div className="all-quiz-quiz-grid">
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
  );
};

export default QuizzesList;
