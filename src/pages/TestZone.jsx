import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/testZone.css";
import { auth, db } from "../firebaseConfig";
import { doc, updateDoc,arrayUnion } from "firebase/firestore";
import { updateUserProgress } from "../firebaseServices/update_user_progress";
import { isQuizSolvedById } from "../firebaseServices/quiz_services";

const TestZone = () => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStatus, setQuestionStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(180); // Default 3 minutes
  const [quizAllocatedTime, setQuizAllocatedTime] = useState(180); 

  const location = useLocation();
  const navigate = useNavigate();

  // Ensure state exists before accessing properties
  const questions = location.state?.questions || [];
  const isQuiz = location.state?.isQuiz || false;
  const quizData = location.state?.quizData || {};
  const quizId = location.state?.quizId || null;
  
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  
  useEffect(() => {
    // Use 3 minutes (180 seconds) as default if allocatedTime is missing or invalid
    const allocatedTime = quizData.timeAllocated ? quizData.timeAllocated * 60 : 180;
    setTimeLeft(allocatedTime);
    setQuizAllocatedTime(allocatedTime);
    console.log("allocateTime:",allocatedTime);
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          calculateScore();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on unmount
  }, [quizData.timeAllocated]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleOptionClick = (option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [currentQuestionIndex]: option,
    }));
  };

  const handleSkip = () => {
    setQuestionStatus((prev) => ({
      ...prev,
      [currentQuestionIndex]: "skipped",
    }));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSaveNext = () => {
    setQuestionStatus((prev) => ({
      ...prev,
      [currentQuestionIndex]: "attempted",
    }));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleUpdateUserProgress = async (correctPercentage) => {
    if (currentUserId) {
      await updateUserProgress(currentUserId, correctPercentage, quizData.subject);
    }
  };

  const calculateScore = async () => {
    if (!quizId) {
      console.error("Quiz ID is missing.");
      return;
    }

    const totalQuestions = questions.length;
    let totalScore = 0;
    let totalCorrect = 0;
    let totalViewed = Object.keys(selectedOptions).length;
    const totalTimeTaken=quizAllocatedTime-timeLeft;

    const updatedQuestionStatus = questions.map((question, index) => {
      const userAnswer = selectedOptions[index] || "Not Answered";
      const isCorrect = question.correctOption && userAnswer === question.correctOption;

      if (isCorrect) {
        totalScore += 3; // Award +3 for correct answer
        totalCorrect++;
      } else if (userAnswer !== "Not Answered") {
        totalScore -= 1; // Deduct -1 for incorrect answer
      }

      return {
        ...question,
        yourAnswer: userAnswer,
      };
    });

    const correctPercentage = (totalCorrect / totalQuestions) * 100;

    try {
      await handleUpdateUserProgress(correctPercentage);
    } catch (error) {
      console.error("Error updating user progress:", error);
    }
  
    try {
      const quizDocRef = doc(db, "quizzes", quizId);
      await updateDoc(quizDocRef, {
        questions: updatedQuestionStatus,
        totalScore,
        correctPercentage,
        quizStatus: true,
        totalQuestions,
        solvedBy:arrayUnion(currentUserId)
      });
      console.log("Quiz Updated Successfully");
    } catch (error) {
      console.error("Error updating quiz:", error);
    }

    navigate("/quizResult", {
      state: {
        questions: updatedQuestionStatus,
        score: totalScore,
        totalCorrect,
        correctPercentage,
        totalQuestions,
        quizStatus: true,
        totalTimeTaken,
        totalViewed
      },
    });
  };

  if (!questions.length) {
    return <p>""</p>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const questionText = (currentQuestion?.question?.trim() ) 
    ? currentQuestion?.question :currentQuestion?.questionImage?.trim() ?"": "No question available";
  const optionsToShow = currentQuestion?.options?.some((opt) => opt.trim() !== "")
    ? currentQuestion.options
    : ["1", "2", "3", "4"];

    return (
      <>
        <div className="test-header">
          <h2>Test Zone</h2>
          <span>Time Left: {formatTime(timeLeft)}</span>
        </div>
    
        <div className="test-container">
          <div className="test-body">
            <div className="question-panel">
              <div className="question-header">
                <span className="question-title">
                  Question {currentQuestionIndex + 1}: {currentQuestion.subject || "Unknown Subject"}
                </span>
              </div>
    
              <div className="question-content">
                <p>{questionText}</p>
                {currentQuestion.questionImage && (
                  <img src={currentQuestion.questionImage} alt="Question" className="question-image" />
                )}
              </div>
    
              {isQuiz ? (
                <div className="options">
                  {optionsToShow.map((opt, index) => (
                    <button
                      key={index}
                      className={`option-btn ${selectedOptions[currentQuestionIndex] === opt ? "selected" : ""}`}
                      onClick={() => handleOptionClick(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="resource-card">
                  <a
                    href={questionText}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-button"
                  >
                    Click Me
                  </a>
                </div>
              )}
    
              <div className="bottom-buttons">  {/* Merged bottom-buttons-wrapper with bottom-buttons */}
                <button className="important-btn">Mark as Important</button>
                <button className="skip-btn" onClick={handleSkip}>
                  Skip
                </button>
                <button className="save-next-btn" onClick={handleSaveNext}>
                  Save & Next
                </button>
              </div>
            </div>
    
            <div className="navigation-section">
              <div className="question-grid">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    className={`question-btn ${i === currentQuestionIndex ? "active" : ""}
                    ${questionStatus[i] === "attempted" ? "attempted" : ""}
                    ${questionStatus[i] === "skipped" ? "skipped" : ""}`}
                    onClick={() => setCurrentQuestionIndex(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button className="submit-btn" onClick={calculateScore}>
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      </>
    );};
export default TestZone;
