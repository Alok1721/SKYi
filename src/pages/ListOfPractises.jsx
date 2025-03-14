import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/listOfPractise.css";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const ListOfPractises = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playlistId, type, questions, userId } = location.state || { playlistId: null, type: "Unknown", questions: [], userId: null };

  const [questionList, setQuestionList] = useState([]);
  const [selectedTag, setSelectedTag] = useState("All");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (questions?.length) {
          setQuestionList(questions);
        } else if (playlistId) {
          const playlistDoc = await getDoc(doc(db, "playlists", playlistId));
          if (playlistDoc.exists()) {
            const questionIds = playlistDoc.data().questions || [];

            const questionPromises = questionIds.map(async (id) => {
              const questionDoc = await getDoc(doc(db, "questions", id));
              return questionDoc.exists() ? { id, ...questionDoc.data() } : null;
            });

            const fetchedQuestions = (await Promise.all(questionPromises)).filter((q) => q !== null);
            setQuestionList(fetchedQuestions);
          }
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, [playlistId, questions]);

  const handleQuestionClick = (question) => {
    navigate("/testZone", { state: { questions: [question], quizId: question.id, isQuiz: question.isQuiz, quizData: question,collectionName:"questions",collectionId:question.id } });
  };

  // Get unique tags for filtering
  const uniqueTags = ["All", ...new Set(questionList.flatMap((q) => q.tags || []))];

  // Filter questions by selected tag
  const filteredQuestions = selectedTag === "All" 
    ? questionList 
    : questionList.filter((q) => q.tags?.includes(selectedTag));

  return (
    <div className="list-of-practises">
      <h2>{type} Questions</h2>

      {/* Filter by Tag */}
      <div className="tag-filter">
        <label>Filter by Tag:</label>
        <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
          {uniqueTags.map((tag, index) => (
            <option key={index} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {filteredQuestions.length > 0 ? (
        filteredQuestions.map((question) => (
          <div 
            key={question.id} 
            className={`question-card ${question.solvedBy?.includes(userId) ? "solved" : "unsolved"}`} 
            onClick={() => handleQuestionClick(question)}
          >
            <h3>{question.question}</h3>
            <p><strong>Subject:</strong> {question.subject || "Unknown"}</p>
            <p><strong>Tags:</strong> {question.tags?.join(", ") || "None"}</p>
            <p><strong>Status:</strong> {question.solvedBy?.includes(userId) ? "Solved ✅" : "Unsolved ❌"}</p>
          </div>
        ))
      ) : (
        <p>No questions found.</p>
      )}
    </div>
  );
};

export default ListOfPractises;
