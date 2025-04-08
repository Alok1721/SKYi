import React from 'react';
import './quizCard.css';  // Import the CSS file
import { auth } from '../../firebaseConfig';
import { FiBook } from 'react-icons/fi';

const QuizCard = ({ quiz, handleStartQuiz }) => {
  const currentUser=auth.currentUser;
  const currentUserId=currentUser? currentUser.uid:null;
  const isQuizSolvedByid =(quiz) =>{
    if(!currentUserId)return false;
    return Array.isArray(quiz.solvedBy) && quiz.solvedBy.includes(currentUserId);

  }
  return (
    <div className={`quiz-card ${isQuizSolvedByid(quiz) ? 'solved' : 'unsolved'}`}>
      <div className="quiz-icon">
        <FiBook />
      </div>
      <div className="quiz-content">
        <h3 className="quiz-title">{quiz.subject + " Quiz" || "Quiz Title"}</h3>
        <p className="quiz-subtitle">
          {quiz.questions?.length + " Questions" || "30 Questions + Pyqs"}
        </p>
        <div className="quiz-buttons">
          <button
            className={`status-btn ${isQuizSolvedByid(quiz) ? 'completed' : 'backlog'}`}
          >
            {isQuizSolvedByid(quiz) ? "Completed" : "Backlog"}
          </button>
          <button
            className="play-btn"
            onClick={() => handleStartQuiz(quiz.id)}
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
