import React, { useEffect, useState } from "react";
import "../styles/todayChallenges.css";
import { useNavigate } from "react-router-dom";
import { fetchTodaysQuizzes, getQuizDetails } from "../firebaseServices/quiz_services";
import { isQuizSolvedByQuizData } from "../firebaseServices/quiz_services";
import { useExam } from '../contexts/ExamContext';

const TodayChallenges = () => {
  const { examName } = useExam();
  const navigate = useNavigate();
  const [challenges, setChallenge] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const quizzes = await fetchTodaysQuizzes(examName);
      setChallenge(quizzes);
    };
    fetchData();
  }, []);

  const handleStartQuiz = async (quizId) => {
    const quizData = await getQuizDetails(quizId,examName);
    if (quizData) {
      navigate("/testZone", {
        state: {
          questions: quizData.questions,
          quizId: quizId,
          isQuiz: quizData.isQuiz,
          quizData: quizData,
        },
      });
    } else {
      alert("Quiz not found!");
    }
  };

  const getAttemptsAndAccuracy = (challenge) => {
    if (!challenge.attempts || challenge.attempts.length === 0) {
      return null;
    }

    const totalAttempts = challenge.attempts.length;
    const lastAttempt = challenge.attempts[totalAttempts - 1];
    const accuracy = lastAttempt.accuracy || 0;

    return {
      attempts: totalAttempts,
      accuracy: Math.round(accuracy)
    };
  };

  return (
    <div className="container">
      <h2 className="title">Today's Challenges</h2>
      <div className="challenge-list">
        {challenges.map((challenge, index) => {
          const isCompleted = isQuizSolvedByQuizData(challenge,examName);
          const stats = getAttemptsAndAccuracy(challenge);
          
          return (
            <div key={index} className={`challenge-card ${isCompleted ? "gradient-green" : "gradient-lightblue"}`}>
              <div className={`status-badge ${isCompleted ? "completed" : "pending"}`}>
                {isCompleted ? "Completed" : "Pending"}
              </div>
              <div className="challenge-content">
                <h3>{challenge.subject?.trim() ? challenge.subject : "Mixed Question"}</h3>
                <p>{challenge.quizDescription}</p>
                
                {stats && (
                  <div className="challenge-stats">
                    <div className="stat-item">
                      <span className="stat-label">Attempts:</span>
                      <span className="stat-value">{stats.attempts}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Accuracy:</span>
                      <span className="stat-value">{stats.accuracy}%</span>
                    </div>
                  </div>
                )}

                <button className={`btn ${isCompleted ? "completed" : ""}`} onClick={() => handleStartQuiz(challenge.id)}>
                  {isCompleted ? "Play Again" : "Start Challenge"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodayChallenges;
