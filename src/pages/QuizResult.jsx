import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/quizResult.css";  // Importing the CSS for quiz result page
import { formatTime } from '../utils/date_time';
const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Retrieve the updated data passed from the previous page
  const {
    score,
    totalCorrect,
    correctPercentage,
    totalQuestions,
    questions,
    totalTimeTaken,
    totalViewed,
  } = location.state || {};

  if (!questions) {
    return <p>No result data available.</p>;
  }

  const totalIncorrect = totalQuestions - totalCorrect;
  const timeTaken = '35 minutes'; // Hardcoded or could be passed dynamically

  const goBack = () => {
    navigate('/allActiveQuizzes');  // Navigate back to quiz list or previous page
  };

  return (
    <div className="quiz-result-container">
      <div className="result-header">
        <h2>Quiz Results</h2>
        <button className="back-btn" onClick={goBack}>Back to Quizzes</button>
      </div>

      <div className="result-body">
      <div className="analysis-card">
          <h3>Quiz Analysis</h3>
          <div className="analysis-info">
            <div className="analysis-item">
              <span>Total Questions:</span> <strong>{totalQuestions}</strong>
            </div>
            <div className="analysis-item">
              <span>Correct Answers:</span> <strong>{totalCorrect}</strong>
            </div>
            <div className="analysis-item">
              <span>Incorrect Answers:</span> <strong>{totalIncorrect}</strong>
            </div>
            <div className="analysis-item">
              <span>Score:</span> <strong>{score}</strong>
            </div>
            <div className="analysis-item">
              <span>Accuracy:</span> <strong>{correctPercentage.toFixed(2)}%</strong>
            </div>
            <div className="analysis-item">
              <span>Time Taken:</span> <strong>{formatTime(totalTimeTaken)}</strong>
            </div>
            <div className="analysis-item">
              <span>Time Question Viewed:</span> <strong>{totalViewed}</strong>
            </div>
          </div>
        
        </div>

        <div className="question-analysis">
          <h3>Question-wise Analysis</h3>
          {questions.map((question, index) => {
            const isCorrect = question.correctOption === question.yourAnswer; // Check if user answer is correct
            return (
              <div key={index} className="question-card">
                <div className="question-content">
                  <p>{question.question}</p>
                  <div className="question-content">
                  {question.questionImage && question.questionImage.trim() !== "" && (
                  <img src={question.questionImage} alt="Question" className="question-image" />
                  )}

            </div>
                  <div className={`answer-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
                <div className="options">
                  {question.options.map((option, optIndex) => {
                    const isSelected = option === question.yourAnswer; // Check if this option was selected by the user
                    const isCorrectOption = option === question.correctOption; // Check if this is the correct option
                    const optionClass = isSelected ? (isCorrectOption ? 'selected-correct' : 'selected-incorrect') : '';
                    
                    return (
                      <div key={optIndex} className={`option ${isCorrectOption ? 'correct-option' : ''} ${optionClass}`}>
                        {option}
                      </div>
                    );
                  })}
                </div>
                <div>Your Answer: {question.yourAnswer}</div>
                <div> {question.solution??""}</div>
                {question.solutionImage && question.solutionImage.trim() !== "" && (
                <div className="solution-section">
                  <h4>Solution:</h4>
                  <img src={question.solutionImage} alt="Solution" className="solution-image" />
                </div>
                  )}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
