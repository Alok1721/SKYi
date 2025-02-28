import React from "react";
import "./progressChart.css";

const ProgressOverview = ({progressData}) => {
//   const progressData = [
//     { subject: "polity", correct: 80, total: 100 },
//     { subject: "history", correct: 70, total: 100 },
//     { subject: "geography", correct: 30, total: 100 },
//     { subject: "currentAffair", correct: 20, total: 100 },
//     { subject: "aptitude", correct: 0, total: 100 },
//     { subject: "environment", correct: 0, total: 100 },
//     { subject: "economic", correct: 0, total: 100 },
//   ];

  const correctPercentage = 60; // Example percentage
  const totalSubjects = progressData.length;
  const totalCorrectPercentage = progressData.reduce((sum, item) => sum + item.averageCorrectPercentage, 0);
  const overallCorrectPercentage = totalSubjects > 0 ? totalCorrectPercentage / totalSubjects : 0;
  
  return (
    <div className="progress-chart-container">
      {/* Progress Overview */}
      <div className="progress-overview">
        <div className="progress-circle">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#ddd" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#34c759"
              strokeWidth="8"
              fill="none"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * overallCorrectPercentage) / 100}
              strokeLinecap="round"
            />
            <text x="50" y="50" textAnchor="middle" alignmentBaseline="middle" fontSize="14" fill="#333">
              {overallCorrectPercentage.toFixed(1)}% <tspan x="50" dy="1.2em">Correct</tspan>
            </text>
          </svg>
        </div>

        <div className="progress-list">
          {progressData.map((item, index) => (
            <div key={index} className="progress-item">
              <span className="subject">{item.subject}</span>
              <div className="progress-bar">
                <div className="correct-bar" style={{ width: `${item.averageCorrectPercentage}%` }}></div>
                <div className="incorrect-bar" style={{ width: `${100-item.averageCorrectPercentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        {/* <div className="filter-dropdown">
        <span>This week ▼</span>
      </div> */}
      </div>

      {/* Dropdown */}
      
    </div>
  );
};

export default ProgressOverview;
