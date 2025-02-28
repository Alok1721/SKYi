import React,{ useEffect, useState } from "react";
import "../styles/allActiveQuiz.css"; // Import CSS file
import { useNavigate } from 'react-router-dom';
import QuizCard from "../components/quiz/quizCard";
import { fetchQuizzesByDate,fetchQuizById } from "../firebaseServices/quiz_services";
const QuizzesList = () => {
  const [quizzesByDate, setQuizzesByDate] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const groupedQuizzes=await fetchQuizzesByDate();
        setQuizzesByDate(groupedQuizzes);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };
    loadQuizzes();
  }, []);

   const handleStartQuiz = async (quizId) => {
          const quizData = await fetchQuizById(quizId);
          if(quizData)
          {
            navigate("/testZone", { state: { questions: quizData.questions,quizId:quizId,isQuiz:quizData.isQuiz,quizData:quizData} });
          }
          else{
            alert("Quiz not Found!");
          }
    };

  return (
    <div className="container">
      <h1 className="title">Polity Quiz</h1>
      {Object.keys(quizzesByDate).map((date) => (
        <div key={date} className="quiz-section">
          <h2 className="quiz-date">{date}</h2>
          <div className="quiz-grid">
            {quizzesByDate[date].map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} handleStartQuiz={handleStartQuiz} />
            ))}
          </div>
        </div>
      ))}   
    </div>
  );
};

export default QuizzesList;
