import React from 'react';
import './QuizCard.css';  // Import the CSS file
import { auth } from '../../firebaseConfig';

const QuizCard = ({ quiz, handleStartQuiz }) => {
  const currentUser=auth.currentUser;
  const currentUserId=currentUser? currentUser.uid:null;
  const isQuizSolvedByid =(quiz) =>{
    if(!currentUserId)return false;
    return Array.isArray(quiz.solvedBy) && quiz.solvedBy.includes(currentUserId);

  }
  return (
    <div className="quiz-card">
      <div className="quiz-icon"></div>
      <h3 className="quiz-title">{quiz.subject + " Quiz" || "Quiz Title"}</h3>
      <p className="quiz-subtitle">
        {quiz.questions?.length + " Questions" || "30 Questions + Pyqs"}
      </p>
      <div className="quiz-buttons">
        <button
          className="disabled-btn"
          style={{
            backgroundColor: isQuizSolvedByid(quiz) ? 'green' : 'lightcoral', // green if quizStatus is 1, else faint red
            cursor: 'default',
          }}
        >
          {isQuizSolvedByid(quiz) ? "Completed" : "Backlog"}
        </button>
        <button
          className="disabled-btn"
          onClick={() => handleStartQuiz(quiz.id)}
        >
          Play
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
