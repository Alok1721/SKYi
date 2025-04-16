import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/quizResult.css";
import { formatTime } from "../utils/date_time";
import { formateQuestion } from "../utils/textUtils";
import { FiArrowLeft, FiArrowRight, FiBarChart2, FiX, FiCheck, FiXCircle, FiMinus, FiTrendingUp } from "react-icons/fi";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [activeGraphTab, setActiveGraphTab] = useState("performance");

  const {
    score,
    totalCorrect,
    totalIncorrect,
    correctPercentage,
    totalQuestions,
    questions,
    totalTimeTaken,
    totalViewed,
    totalSkipped = 0,
    totalAttempted = 0,
    averageTimePerQuestion = 0,
    timePerQuestion = {},
    collectionName = "",
    totalTimeAllocated = 0,
  } = location.state || {};

  if (!questions || questions.length === 0 || !totalTimeTaken || !totalQuestions) {
    return <p>No result data available.</p>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = currentQuestion.isCorrect;
  const isAttempted = currentQuestion.isAttempted;
  const timeThreshold = (totalTimeAllocated) / totalQuestions;
  const performanceData = questions.reduce((acc, question, index) => {
    const prevScore = index === 0 ? 0 : acc[index - 1].score;
    const scoreChange = question.isCorrect ? 3 : question.isAttempted ? -1 : 0;
    acc.push({
      question: `Q${index + 1}`,
      score: prevScore + scoreChange,
    });
    return acc;
  }, []);

  // Time Data
  const timeData = questions.map((question, index) => ({
    question: `Q${index + 1}`,
    time: timePerQuestion[index] || 0,
  }));

  // Chart Data for Performance (Unchanged)
  const performanceChartData = {
    labels: performanceData.map((data) => data.question),
    datasets: [
      {
        label: "Cumulative Score",
        data: performanceData.map((data) => data.score),
        backgroundColor: performanceData.map((data, index) =>
          questions[index].isCorrect ? "rgba(34, 197, 94, 0.6)" : questions[index].isAttempted ? "rgba(239, 68, 68, 0.6)" : "rgba(100, 116, 139, 0.6)"
        ),
        borderColor: performanceData.map((data, index) =>
          questions[index].isCorrect ? "rgba(34, 197, 94, 1)" : questions[index].isAttempted ? "rgba(239, 68, 68, 1)" : "rgba(100, 116, 139, 1)"
        ),
        borderWidth: 1,
        barThickness: "flex",
      },
    ],
  };

  // Chart Data for Time
  const timeChartData = {
    labels: timeData.map((data) => data.question),
    datasets: [
      {
        label: "Time Spent (seconds)",
        data: timeData.map((data) => (data.time).toFixed(2)),
        backgroundColor: timeData.map((data) => {
          if (data.time === 0) {
            return "rgba(100, 116, 139, 0.6)"; // Gray for unattempted
          } else if (data.time > timeThreshold) {
            return "rgba(239, 68, 68, 0.6)"; // Reddish for above threshold
          } else {
            return "rgba(34, 197, 94, 0.6)"; // Greenish for below or equal threshold
          }
        }),
        borderColor: timeData.map((data) => {
          if (data.time === 0) {
            return "rgba(100, 116, 139, 1)";
          } else if (data.time > timeThreshold) {
            return "rgba(239, 68, 68, 1)";
          } else {
            return "rgba(34, 197, 94, 1)";
          }
        }),
        borderWidth: 1,
        barThickness: "flex",
      },
    ],
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 14 },
          color: "var(--text-primary)",
        },
      },
      title: {
        display: true,
        text: activeGraphTab === "performance" ? "Performance Over Time" : "Time Spent Per Question",
        font: { size: 18 },
        color: "var(--text-primary)",
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            activeGraphTab === "performance"
              ? `${context.dataset.label}: ${context.raw}`
              : `${context.dataset.label}: ${formatTime(context.raw)} (Threshold: ${formatTime(timeThreshold)})`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: activeGraphTab === "performance" ? "Score" : "Time (seconds)",
          font: { size: 14 },
          color: "var(--text-secondary)",
        },
        ticks: {
          color: "var(--text-secondary)",
          font: { size: 12 },
        },
      },
      x: {
        title: {
          display: true,
          text: "Question",
          font: { size: 14 },
          color: "var(--text-secondary)",
        },
        ticks: {
          color: "var(--text-secondary)",
          font: { size: 12 },
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const getStatusIcon = () => {
    if (!isAttempted) return <FiMinus className="status-icon" />;
    return isCorrect ? <FiCheck className="status-icon" /> : <FiXCircle className="status-icon" />;
  };

  const getStatusClass = () => {
    if (!isAttempted) return "unattempted";
    return isCorrect ? "correct" : "incorrect";
  };

  const getPerformanceEmoji = () => {
    if (correctPercentage < 50) {
      return <span className="qr-emoji qr-emoji-sad">😢</span>;
    } else if (correctPercentage >= 50 && correctPercentage <= 70) {
      return <span className="qr-emoji qr-emoji-medium">😐</span>;
    } else {
      return <span className="qr-emoji qr-emoji-happy">😊</span>;
    }
  };

  return (
    <div className="qr-quiz-result-container">
      <div className="qr-test-container">
        <div className="qr-test-header">
          <h2>Quiz Results</h2>
          <div className="qr-header-buttons">
            <button className="qr-analytics-btn" onClick={() => setShowAnalytics(true)}>
              <FiBarChart2 /> Analytics
            </button>
            <button className="qr-graph-btn" onClick={() => setShowGraph(true)}>
              <FiTrendingUp /> Graph
            </button>
            <button className="qr-back-btn" onClick={() => navigate("/allActiveQuizzes")}>
              Back to Quizzes
            </button>
          </div>
        </div>

        <div className="qr-test-body">
          <div className="qr-question-panel">
            <div className="qr-question-header">
              <span className="qr-question-title">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>

            <div className="qr-question-content">
              <div className="qr-question-text">
                <p dangerouslySetInnerHTML={{ __html: formateQuestion(currentQuestion.question) }} />
                {currentQuestion.questionImage && currentQuestion.questionImage.trim() && (
                  <img src={currentQuestion.questionImage} alt="Question" className="question-image" />
                )}
              </div>
              <div className="qr-user-answer-container">
                <h4>Your Selected Option: {currentQuestion.yourAnswer}</h4>
                <p>Time Spent: {formatTime(timePerQuestion[currentQuestionIndex] || 0)}</p>
              </div>
              <div className="qr-status-card-container">
                <div className={`qr-status-card ${getStatusClass()}`}>
                  {getStatusIcon()}
                  <span className="qr-status-text">
                    {isAttempted
                      ? isCorrect
                        ? "Correct Answer"
                        : "Incorrect Answer"
                      : "Not Attempted"}
                  </span>
                </div>
              </div>

              {currentQuestion.solution && (
                <div className="qr-solution-section">
                  <p>Correct Option: {currentQuestion.correctOption}</p>
                  <h4>Solution:</h4>
                  <p dangerouslySetInnerHTML={{ __html: currentQuestion.solution }} />
                  {currentQuestion.solutionImage && currentQuestion.solutionImage.trim() && (
                    <img src={currentQuestion.solutionImage} alt="Solution" className="solution-image" />
                  )}
                </div>
              )}

              <div className="qr-bottom-buttons">
                <button
                  className="qr-nav-btn prev-btn"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <FiArrowLeft /> Previous
                </button>
                <button
                  className="qr-nav-btn next-btn"
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next <FiArrowRight />
                </button>
              </div>
            </div>
          </div>

          <div className="qr-navigation-section">
            <div className="qr-question-grid">
              {questions.map((question, index) => {
                const isAttempted = question.isAttempted;
                const isCorrect = question.isCorrect;
                const statusClass = isAttempted ? (isCorrect ? "correct" : "incorrect") : "unattempted";
                return (
                  <button
                    key={index}
                    className={`qr-question-btn ${index === currentQuestionIndex ? "active" : ""} ${statusClass}`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAnalytics && (
        <div className="qr-analytics-modal">
          <div className="qr-analytics-content">
            <div className="qr-analytics-header">
              <h2>Quiz Analytics</h2>
              <button className="qr-close-btn" onClick={() => setShowAnalytics(false)}>
                <FiX />
              </button>
            </div>
            <div className="qr-analytics-body">
              <div className="qr-analytics-grid">
                <div className="qr-analytics-card">
                  <h3>Performance</h3>
                  <div className="qr-emoji-container">
                    {getPerformanceEmoji()}
                  </div>
                  <div className="qr-analytics-item">
                    <span>Score:</span>
                    <strong>{score}</strong>
                  </div>
                  <div className="qr-analytics-item">
                    <span>Accuracy:</span>
                    <strong>{correctPercentage.toFixed(2)}%</strong>
                  </div>
                </div>
                <div className="qr-analytics-card">
                  <h3>Answers</h3>
                  <div className="qr-analytics-item">
                    <span>Correct:</span>
                    <strong>{totalCorrect}</strong>
                  </div>
                  <div className="qr-analytics-item">
                    <span>Incorrect:</span>
                    <strong>{totalIncorrect}</strong>
                  </div>
                  <div className="qr-analytics-item">
                    <span>Skipped:</span>
                    <strong>{totalSkipped}</strong>
                  </div>
                  <div className="qr-analytics-item">
                    <span>Attempted:</span>
                    <strong>{totalAttempted}</strong>
                  </div>
                </div>
                <div className="qr-analytics-card">
                  <h3>Time</h3>
                  <div className="qr-analytics-item">
                    <span>Total Time:</span>
                    <strong>{formatTime(totalTimeTaken)}</strong>
                  </div>
                  <div className="qr-analytics-item">
                    <span>Avg. Time/Question:</span>
                    <strong>{formatTime(Number(averageTimePerQuestion.toFixed(2)))}</strong>
                  </div>
                  <div className="qr-analytics-item">
                    <span>Questions Viewed:</span>
                    <strong>{totalViewed}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGraph && (
        <div className="qr-graph-modal">
          <div className="qr-graph-content">
            <div className="qr-graph-header">
              <h2>Performance Graph</h2>
              <button className="qr-close-btn" onClick={() => setShowGraph(false)}>
                <FiX />
              </button>
            </div>
            <div className="qr-graph-tabs">
              <button
                className={`qr-graph-tab ${activeGraphTab === "performance" ? "active" : ""}`}
                onClick={() => setActiveGraphTab("performance")}
              >
                Performance
              </button>
              <button
                className={`qr-graph-tab ${activeGraphTab === "time" ? "active" : ""}`}
                onClick={() => setActiveGraphTab("time")}
              >
                Time Spent
              </button>
            </div>
            <div className="qr-graph-body">
              <div className="qr-graph-wrapper">
                <Bar
                  data={activeGraphTab === "performance" ? performanceChartData : timeChartData}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResult;