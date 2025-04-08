import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./quizCard.css"; 
import { auth } from "../../firebaseConfig";
import { FiBook, FiList } from "react-icons/fi"; 
import { fetchUserSubmissionsByQuizId } from "../../firebaseServices/quiz_services";
import { formatDateTime, formatTime } from "../../utils/date_time";


const QuizCard = ({ quiz, handleStartQuiz }) => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const currentUserId = currentUser ? currentUser.uid : null;
  const [showModal, setShowModal] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  const isQuizSolvedById = (quiz) => {
    if (!currentUserId) return false;
    return Array.isArray(quiz.solvedBy) && quiz.solvedBy.includes(currentUserId);
  };

  const handleShowSubmissions = async () => {
    if (!isQuizSolvedById(quiz)) {
      setSubmissions([]);
      setShowModal(true);
      return;
    }
    const fetchedSubmissions = await fetchUserSubmissionsByQuizId(currentUserId, quiz.id);
    setSubmissions(fetchedSubmissions);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleViewResult = (quizResult) => {
    navigate("/quizResult", { state: quizResult });
    setShowModal(false);
  };

  const isSolved = isQuizSolvedById(quiz);

  return (
    <>
      <div className={`quiz-card ${isSolved ? "solved" : "unsolved"}`}>
        <div className="quiz-icon">
          <FiBook />
        </div>
        <div className="quiz-content">
          <h3 className="quiz-title">{quiz.subject + " Quiz" || "Quiz Title"}</h3>
          <p className="quiz-subtitle">
            {quiz.questions?.length + " Questions" || "30 Questions + Pyqs"}
          </p>
          <div className="quiz-buttons">
            <button className={`status-btn ${isSolved ? "completed" : "backlog"}`}>
              {isSolved ? "Completed" : "Backlog"}
            </button>
            <button className="play-btn" onClick={() => handleStartQuiz(quiz.id)}>
              Play
            </button>
            {isSolved && (
              <button className="submission-btn" onClick={handleShowSubmissions}>
                <FiList />
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="submission-modal">
          <div className="submission-modal-content">
            <div className="submission-modal-header">
              <h2>Submissions</h2>
              <button className="submission-close-btn" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="submission-modal-body">
              <table className="submission-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length > 0 ? (
                    submissions.map((submission, index) => (
                      <tr key={index}>
                        <td>{formatDateTime(submission.timeStamp)}</td>
                        <td>{submission.quizResult.score}</td>
                        <td>
                          <button
                            className="view-result-btn"
                            onClick={() => handleViewResult(submission.quizResult)}
                          >
                            View Result
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No submissions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizCard;