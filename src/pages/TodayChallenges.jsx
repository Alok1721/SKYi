import React, { useEffect, useState } from "react";
import "../styles/todayChallenges.css"; 
import { useNavigate } from "react-router-dom";
import { fetchTodaysQuizzes, getQuizDetails } from "../firebaseServices/quiz_services"; // Import Firebase service
import { isQuizSolvedByQuizData } from "../firebaseServices/quiz_services";

const TodayChallenges = () => {
  const navigate = useNavigate();
  const [challenges, setChallenge] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const quizzes = await fetchTodaysQuizzes();
      console.log("fetched quizzes: ",quizzes);
      setChallenge(quizzes);
    };
    fetchData();
  }, []);

  const handleStartQuiz = async (quizId) => {
    const quizData = await getQuizDetails(quizId);
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

  return (
    <div className="container">
      <h2 className="title">Today Challenges</h2>
      <div className="challenge-list">
        {challenges.map((challenge, index) => (
          <div key={index} className={`challenge-card ${isQuizSolvedByQuizData(challenge) ? "gradient-green" : "gradient-lightblue"}`}>
            <div className="challenge-content">
              <h3>{challenge.subject?.trim() ? challenge.subject : "Mixed Question"}</h3>
              <p>{challenge.quizDescription}</p>
              <button className={isQuizSolvedByQuizData(challenge) ? "btn completed" : "btn"} onClick={() => handleStartQuiz(challenge.id)}>
                {isQuizSolvedByQuizData(challenge) ? "COMPLETED" : "Start"}
              </button>
            </div>
            <div className="icon-placeholder"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayChallenges;
