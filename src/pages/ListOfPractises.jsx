import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/listOfPractise.css";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const ListOfPractises = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playlistId, type, questions, userId } = location.state || { playlistId: null, type: "Unknown", questions: [], userId: null };

  const [questionList, setQuestionList] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]); // Store multiple selected tags
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;

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
    navigate("/testZone", { state: { questions: [question], quizId: question.id, isQuiz: question.isQuiz, quizData: question, collectionName: "questions", collectionId: question.id } });
  };

  // Get unique tags from all questions
  const uniqueTags = [...new Set(questionList.flatMap((q) => q.tags || []))];

  // Handle tag selection
  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag)); // Deselect tag
    } else {
      setSelectedTags([...selectedTags, tag]); // Select tag
    }
  };

  // Filter questions based on selected tags
  const filteredQuestions = selectedTags.length === 0
    ? questionList // Show all questions if no tags are selected
    : questionList.filter((q) => selectedTags.every((tag) => q.tags?.includes(tag))); // Show questions that match all selected tags

  return (
    <div className="list-of-practises">
      <h2>{type} Questions</h2>

      {/* Tag Filter Buttons */}
      <div className="tag-filter">
        <label>Filter by Tags:</label>
        <div className="tag-buttons">
          {uniqueTags.map((tag, index) => (
            <button
              key={index}
              className={`tag-button ${selectedTags.includes(tag) ? "active" : ""}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Question List */}
      {filteredQuestions.length > 0 ? (
        filteredQuestions.map((question) => (
          <div
            key={question.id}
            className={`question-card ${question.solvedBy?.includes(currentUserId) ? "solved" : "unsolved"}`}
            onClick={() => handleQuestionClick(question)}
          >
            <h3>{question.question}</h3>
            <p><strong>Subject:</strong> {question.subject || "Unknown"}</p>
            <p><strong>Tags:</strong> {question.tags?.join(", ") || "None"}</p>
            <p><strong>Status:</strong> {question.solvedBy?.includes(currentUserId) ? "Solved ✅" : "Unsolved ❌"}</p>
          </div>
        ))
      ) : (
        <p>No questions found.</p>
      )}
    </div>
  );
};

export default ListOfPractises;