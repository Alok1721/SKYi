import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/testZone.css";
import { auth, db } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { updateUserProgress } from "../firebaseServices/update_user_progress";
import { isQuizSolvedById,submitQuizResult } from "../firebaseServices/quiz_services";
import { fetchCollectionData, updateCollectionData } from "../firebaseServices/firestoreUtils";
import { formateQuestion } from "../utils/textUtils";
import LoadingScreen from "../components/loadingScreen/LoadingScreen";

const TestZone = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    quizId, 
    questions = [], 
    isQuiz = false, 
    quizData = {}, 
    collectionName = "quizzes", 
    collectionId, 
    groupMode = false 
  } = location.state || {};

  const [selectedOptions, setSelectedOptions] = useState(() => {
    const saved = localStorage.getItem(`quiz_${quizId}_selectedOptions`);
    return saved ? JSON.parse(saved) : {};
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = localStorage.getItem(`quiz_${quizId}_currentQuestionIndex`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [questionStatus, setQuestionStatus] = useState(() => {
    const saved = localStorage.getItem(`quiz_${quizId}_questionStatus`);
    return saved ? JSON.parse(saved) : {};
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(`quiz_${quizId}_timeLeft`);
    const allocatedTime = groupMode ? questions.length * 120 : (quizData.timeAllocated ? quizData.timeAllocated * 60 : 180);
    return saved ? parseInt(saved, 10) : allocatedTime;
  });
  const [quizAllocatedTime, setQuizAllocatedTime] = useState(() => {
    return quizData.timeAllocated ? quizData.timeAllocated * 60 : 180;
  });
  const [showWarning, setShowWarning] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [timePerQuestion, setTimePerQuestion] = useState(() => {
    const saved = localStorage.getItem(`quiz_${quizId}_timePerQuestion`);
    return saved ? JSON.parse(saved) : {};
  });
  const [lastSwitchTime, setLastSwitchTime] = useState(Date.now() / 1000); // Track time of last question switch
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    localStorage.setItem(`quiz_${quizId}_selectedOptions`, JSON.stringify(selectedOptions));
  }, [selectedOptions, quizId]);

  useEffect(() => {
    localStorage.setItem(`quiz_${quizId}_currentQuestionIndex`, currentQuestionIndex);
  }, [currentQuestionIndex, quizId]);

  useEffect(() => {
    localStorage.setItem(`quiz_${quizId}_questionStatus`, JSON.stringify(questionStatus));
  }, [questionStatus, quizId]);

  useEffect(() => {
    localStorage.setItem(`quiz_${quizId}_timeLeft`, timeLeft);
  }, [timeLeft, quizId]);

  useEffect(() => {
    localStorage.setItem(`quiz_${quizId}_timePerQuestion`, JSON.stringify(timePerQuestion));
  }, [timePerQuestion, quizId]);

  useEffect(() => {
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

    return () => clearInterval(timer);
  }, [quizId]);

  // Update time spent when switching questions
  const updateTimePerQuestion = (newIndex) => {
    const currentTime = Date.now() / 1000; // Current time in seconds
    const timeSpent = currentTime - lastSwitchTime;
    setTimePerQuestion((prev) => ({
      ...prev,
      [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + timeSpent,
    }));
    setLastSwitchTime(currentTime);
    setCurrentQuestionIndex(newIndex);
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleOptionClick = (option) => {
    setShowWarning(false);
    setSelectedOptions((prev) => ({
      ...prev,
      [currentQuestionIndex]: prev[currentQuestionIndex] === option ? null : option,
    }));
  };

  const handleSkip = () => {
    setShowWarning(false);
    setQuestionStatus((prev) => ({
      ...prev,
      [currentQuestionIndex]: "skipped",
    }));
    if (currentQuestionIndex < questions.length - 1) {
      updateTimePerQuestion(currentQuestionIndex + 1);
    }
  };

  const handleSaveNext = () => {
    if (!selectedOptions[currentQuestionIndex] && isQuiz) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    setQuestionStatus((prev) => ({
      ...prev,
      [currentQuestionIndex]: "attempted",
    }));
    if (currentQuestionIndex < questions.length - 1) {
      updateTimePerQuestion(currentQuestionIndex + 1);
    }
  };

  const handleUpdateUserProgress = async (correctPercentage,subject) => {
    if (currentUserId) {
      const createdAt = quizData.createdAt?.toDate ? quizData.createdAt.toDate() : new Date();
      console.log("Updating user progress...","subject:",subject);
      await updateUserProgress(currentUserId, correctPercentage, subject|| "Mixed", createdAt);
    }
  };

  const calculateScore = async () => {
    if (!quizId) {
      console.error("Quiz ID is missing.");
      return;
    }
    setIsSubmitting(true);
    // Update time for the last question
    try{const currentTime = Date.now() / 1000;
    setTimePerQuestion((prev) => ({
      ...prev,
      [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + (currentTime - lastSwitchTime),
    }));

    const totalQuestions = questions.length;
    let totalScore = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalViewed = Object.keys(selectedOptions).length;
    const totalTimeTaken = quizAllocatedTime - timeLeft;
    const totalSkipped = Object.values(questionStatus).filter((status) => status === "skipped").length;
    const totalAttempted = Object.values(questionStatus).filter((status) => status === "attempted").length;
    const averageTimePerQuestion = totalTimeTaken / (totalViewed || totalQuestions); // Avoid division by 0

    const updatedQuestionStatus = await Promise.all(questions.map(async (question, index) => {
      const userAnswer = selectedOptions[index];
      const isAttempted = userAnswer !== undefined && userAnswer !== null;
      const isCorrect = isAttempted && question.correctOption ? userAnswer === question.correctOption : false;

      
      if (groupMode && question.id) {
        try {
          const questionRef = doc(db, "questions", question.id);
          const updateData = {
            youAnswer: userAnswer || "Not Attempted",
            isCorrect,
          };
          if (isAttempted) {
            updateData.solvedBy = arrayUnion(currentUserId);
          }
          await updateDoc(questionRef, updateData);
        } catch (error) {
          console.error(`Error updating question ${question.id}:`, error);
        }
      }else if(!isQuiz) {
        return {
          ...question,
          yourAnswer: question.correctOption,
          isCorrect: true,
          isAttempted: true,
          timeSpent: timePerQuestion[index] || 0,
        };
      }

      if (isCorrect) {
        totalScore += 3;
        totalCorrect++;
      } else if (isAttempted) {
        totalScore -= 1;
        totalIncorrect++;
      }

      return {
        ...question,
        yourAnswer: userAnswer || "Not Attempted",
        isCorrect,
        isAttempted,
        timeSpent: timePerQuestion[index] || 0, // Include time spent
      };
    }));

    const correctPercentage = (totalCorrect / totalQuestions) * 100;

    try {
      if (groupMode) {
        await handleUpdateUserProgress(correctPercentage, "Practise");
      } else if (collectionName === "quizzes") {
        await handleUpdateUserProgress(correctPercentage, quizData.subject);
        const quizRef = doc(db, collectionName, collectionId);
        await updateDoc(quizRef, {
          questions: updatedQuestionStatus,
          totalScore,
          correctPercentage,
          quizStatus: true,
          totalQuestions,
          solvedBy: arrayUnion(currentUserId),
        });
      } else {
        await handleUpdateUserProgress(correctPercentage, questions[0].subject);
        const questionRef = doc(db, collectionName, collectionId);
        await updateDoc(questionRef, {
          youAnswer: selectedOptions[currentQuestionIndex],
          isCorrect: updatedQuestionStatus[currentQuestionIndex].isCorrect,
          solvedBy: arrayUnion(currentUserId),
        });
      }
      console.log("Quiz Updated Successfully");
    } catch (error) {
      console.error("Error updating quiz:", error);
    }

    localStorage.removeItem(`quiz_${quizId}_selectedOptions`);
    localStorage.removeItem(`quiz_${quizId}_currentQuestionIndex`);
    localStorage.removeItem(`quiz_${quizId}_questionStatus`);
    localStorage.removeItem(`quiz_${quizId}_timeLeft`);
    localStorage.removeItem(`quiz_${quizId}_timePerQuestion`);

    
    const quizResult = {
      score: totalScore,
      totalCorrect,
      totalIncorrect,
      correctPercentage,
      totalQuestions,
      questions: updatedQuestionStatus,
      totalTimeTaken,
      totalViewed,
      totalSkipped,
      totalAttempted,
      averageTimePerQuestion,
      timePerQuestion,
      collectionName,
      totalTimeAllocated: quizAllocatedTime,
      isGroupMode: groupMode,
    };
    if(!groupMode)
    {
      const success = await submitQuizResult(quizId, quizResult);
      if (success) {
        navigate("/quizResult", { state: quizResult });
      } else {
        alert("Failed to submit quiz. Please try again."); 
      }
    }else{
      navigate("/quizResult", { state: quizResult });
    }
  }catch (error) {
    console.error("Error calculating score:", error);
  }finally{ 
    setIsSubmitting(false);   
  }
    
    
  };
  if (isSubmitting) {
    return <LoadingScreen message="Loading result..." />;
  }

  if (!questions.length) {
    return <p>""</p>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const questionText = currentQuestion?.question?.trim()
    ? currentQuestion?.question
    : currentQuestion?.questionImage?.trim()
    ? ""
    : "No question available";
  const optionsToShow = currentQuestion?.options?.some((opt) => opt.trim() !== "")
    ? currentQuestion.options
    : ["1", "2", "3", "4"];

  return (
    <>
      <div className="tz-test-header">
        <h2>Test Zone</h2>
        <span>Time Left: {formatTime(timeLeft)}</span>
      </div>

      <div className="tz-test-container">
        <div className="tz-test-body">
          <div className="tz-question-panel">
            <div className="tz-question-header">
              <span className="tz-question-title">
                Question {currentQuestionIndex + 1}: {currentQuestion.subject || "Unknown Subject"}
              </span>
            </div>

            <div className="tz-question-content">
              <p dangerouslySetInnerHTML={{ __html: formateQuestion(questionText) }}></p>
              {currentQuestion.questionImage && (
                <img src={currentQuestion.questionImage} alt="Question" className="question-image" />
              )}
            </div>

            {isQuiz ? (
              <div className="tz-options">
                {optionsToShow.map((opt, index) => (
                  <button
                    key={index}
                    className={`tz-option-btn ${selectedOptions[currentQuestionIndex] === opt ? "selected" : ""}`}
                    onClick={() => handleOptionClick(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="tz-resource-card">
                <a href={questionText} target="_blank" rel="noopener noreferrer" className="tz-link-button">
                  Click Me
                </a>
              </div>
            )}
            {showWarning && (
              <div className="tz-warning-card">
                <p>Please select an option before proceeding!</p>
              </div>
            )}

            <div className="tz-bottom-buttons">
              <button className="tz-important-btn">Mark as Important</button>
              <button className="tz-skip-btn" onClick={handleSkip}>
                Skip
              </button>
              <button className="tz-save-next-btn" onClick={handleSaveNext}>
                Save & Next
              </button>
            </div>
          </div>

          <div className="tz-navigation-wrapper">
            <button className="tz-nav-expand-btn" onClick={() => setIsNavExpanded(!isNavExpanded)}>
              {isNavExpanded ? "vv" : "^^"}
            </button>
            {isNavExpanded && (
              <div className="tz-navigation-section">
                <div className="tz-question-grid">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      className={`tz-question-btn ${i === currentQuestionIndex ? "active" : ""} ${
                        questionStatus[i] === "attempted" ? "attempted" : ""
                      } ${questionStatus[i] === "skipped" ? "skipped" : ""}`}
                      onClick={() => updateTimePerQuestion(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button className="tz-submit-btn" onClick={calculateScore}>
                  SUBMIT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TestZone;