import React,{ useEffect, useState } from "react";
import { db } from "../firebaseConfig"; // Adjust path based on your project structure
import { collection, query, getDocs,getDoc ,doc, where} from "firebase/firestore";
import "../styles/allActiveBacklogs.css"; // Import CSS file
import { useNavigate } from 'react-router-dom';
import QuizCard from "../components/quiz/quizCard";
import { fetchActiveBacklogs,fetchQuizById } from "../firebaseServices/quiz_services";

const AllActiveBacklogs = () => {
  const [quizzesByDate, setQuizzesByDate] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        let groupedQuizzes = await fetchActiveBacklogs();
        setQuizzesByDate(groupedQuizzes);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };

    loadQuizzes();
  }, []);

   const handleStartQuiz = async (quizId) => {
      try {
        const quizData = await fetchQuizById(quizId);
        if (quizData.exists()) {
          navigate("/testZone", { state: { questions: quizData.questions,quizId:quizId,isQuiz:quizData.isQuiz,quizData:quizData} });
        } else {
          alert("Quiz not found!");
        }
      } catch (error) {
        console.error("Error fetching quiz questions:", error);
        alert("Failed to load questions.");
      }
    };
    
  return (
    <div className="container">
      <h1 className="title">Backlogs</h1>
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

export default AllActiveBacklogs;
