import React, { useEffect, useState } from "react";
import "../styles/adminQuestionMaker.css"; // Import CSS file
import { db } from "../firebaseConfig";
import { collection, addDoc, updateDoc, doc, arrayUnion, getDocs } from "firebase/firestore";
import { uploadToCloudinary } from "../cloudinaryServices/cloudinary_services";

const AdminQuestion = () => {
  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctOption: "",
      playlist: "",
      tags: [],
      solution: "",
      questionImage: "",
      solutionImage: "",
    },
  ]);
  const [playlists, setPlaylists] = useState([]);

  // Fetch playlists from Firestore
  useEffect(() => {
    const fetchPlaylists = async () => {
      const querySnapshot = await getDocs(collection(db, "playlists"));
      const playlistData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setPlaylists(playlistData);
    };
    fetchPlaylists();
  }, []);

  // Add a new question block
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctOption: "",
        playlist: "",
        tags: [],
        solution: "",
        questionImage: "",
        solutionImage: "",
      },
    ]);
  };

  // Handle text input changes
  const handleChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  // Handle option changes
  const handleOptionChange = (index, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[index].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  // Handle tags input
  const handleTagsChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].tags = value.split(",").map((tag) => tag.trim());
    setQuestions(newQuestions);
  };

  // Handle image uploads
  const handleImageUpload = async (index, field, file) => {
    if (!file) return;
    const imageUrl = await uploadToCloudinary(file);
    if (imageUrl) {
      const newQuestions = [...questions];
      newQuestions[index][field] = imageUrl;
      setQuestions(newQuestions);
    }
  };

  // Submit all questions
  const handleSubmit = async () => {
    try {
      for (const question of questions) {
        if (
          !question.question ||
          !question.correctOption ||
          !question.playlist 
        //   question.options.some((opt) => !opt.trim())
        ) {
          alert("Please fill all fields for each question.");
          return;
        }

        // Add question to Firestore
        const questionRef = await addDoc(collection(db, "questions"), {
          question: question.question,
          options: question.options,
          correctOption: question.correctOption,
          createdAt: new Date(),
          isQuiz: true,
          tags: question.tags,
          solution: question.solution,
          questionImage: question.questionImage || "",
          solutionImage: question.solutionImage || "",
        });

        // Update playlist with the new question ID
        const playlistRef = doc(db, "playlists", question.playlist);
        await updateDoc(playlistRef, {
          questions: arrayUnion(questionRef.id),
          updatedAt: new Date(),
        });
      }

      alert("Questions added successfully!");
      setQuestions([
        {
          question: "",
          options: ["", "", "", ""],
          correctOption: "",
          playlist: "",
          tags: [],
          solution: "",
          questionImage: "",
          solutionImage: "",
        },
      ]); // Reset form
    } catch (error) {
      console.error("Error adding questions:", error);
    }
  };

  return (
    <div className="admin-question-container">
      <h2>Add Questions</h2>
      {questions.map((q, index) => (
        <div key={index} className="question-block">
          <div className="form-group">
            <label>Question:</label>
            <textarea
              placeholder="Enter question"
              value={q.question}
              onChange={(e) => handleChange(index, "question", e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Question Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImageUpload(index, "questionImage", e.target.files[0])
              }
            />
            {q.questionImage && (
              <img src={q.questionImage} alt="Question" className="uploaded-image" />
            )}
          </div>

          <div className="form-group">
            <label>Options:</label>
            {q.options.map((option, optionIndex) => (
              <input
                key={optionIndex}
                type="text"
                placeholder={`Option ${optionIndex + 1}`}
                value={option}
                onChange={(e) =>
                  handleOptionChange(index, optionIndex, e.target.value)
                }
              />
            ))}
          </div>

          <div className="form-group">
            <label>Correct Option:</label>
            <input
              type="text"
              placeholder="Correct option (e.g., Option 1)"
              value={q.correctOption}
              onChange={(e) => handleChange(index, "correctOption", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Solution:</label>
            <textarea
              placeholder="Enter solution"
              value={q.solution}
              onChange={(e) => handleChange(index, "solution", e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Solution Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImageUpload(index, "solutionImage", e.target.files[0])
              }
            />
            {q.solutionImage && (
              <img src={q.solutionImage} alt="Solution" className="uploaded-image" />
            )}
          </div>

          <div className="form-group">
            <label>Playlist:</label>
            <select
              value={q.playlist}
              onChange={(e) => handleChange(index, "playlist", e.target.value)}
            >
              <option value="">Select Playlist</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated):</label>
            <input
              type="text"
              placeholder="Tags (e.g., history, polity)"
              value={q.tags.join(", ")}
              onChange={(e) => handleTagsChange(index, e.target.value)}
            />
          </div>
        </div>
      ))}

      <div className="action-buttons">
        <button onClick={handleAddQuestion} className="add-question-btn">
          Add Another Question
        </button>
        <button onClick={handleSubmit} className="submit-btnn">
          Post Questions
        </button>
      </div>
    </div>
  );
};

export default AdminQuestion;