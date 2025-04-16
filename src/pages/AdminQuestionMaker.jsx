import React, { useEffect, useState, useMemo } from "react";
import "../styles/adminQuestionMaker.css";
import { db } from "../firebaseConfig";
import { collection, getDocs, doc, query, where, writeBatch,arrayUnion } from "firebase/firestore";
import { uploadToCloudinary } from "../cloudinaryServices/cloudinary_services";
import LoadingScreen from "../components/loadingScreen/LoadingScreen";

const AdminQuestion = () => {
  const [questions, setQuestions] = useState([
    {
      questionNumber: 1,
      question: "",
      options: ["", "", "", ""],
      correctOption: "",
      playlists: [],
      tags: [],
      solution: "",
      questionImage: "",
      solutionImage: "",
    },
  ]);
  const [allPlaylists, setAllPlaylists] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      const querySnapshot = await getDocs(collection(db, "playlists"));
      const playlistData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        type: doc.data().type,
      }));
      const groupedPlaylists = playlistData.reduce((acc, playlist) => {
        const type = playlist.type || "Others";
        if (!acc[type]) acc[type] = [];
        acc[type].push(playlist);
        return acc;
      }, {});
      Object.keys(groupedPlaylists).forEach((type) => {
        groupedPlaylists[type].sort((a, b) => a.name.localeCompare(b.name));
      });
      setAllPlaylists(groupedPlaylists);
    };
    fetchPlaylists();
  }, []);

  // Memoize selected playlist IDs to optimize useEffect trigger
  const selectedPlaylistIds = useMemo(() => {
    const ids = new Set();
    questions.forEach((q) => {
      q.playlists.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [questions]);

  useEffect(() => {
    const fetchTagsFromSelectedPlaylists = async () => {
      if (selectedPlaylistIds.length === 0) {
        console.log("No playlists selected, clearing tags.");
        setAllTags([]);
        return;
      }

      console.log("Fetching tags for playlists:", selectedPlaylistIds);

      try {
        // Query questions where playlists array contains any of the selectedPlaylistIds
        const questionsQuery = query(
          collection(db, "questions"),
          where("playlists", "array-contains-any", selectedPlaylistIds)
        );
        const querySnapshot = await getDocs(questionsQuery);

        const tagSet = new Set();
        querySnapshot.forEach((doc) => {
          const tags = doc.data().tags || [];
          tags.forEach((tag) => tagSet.add(tag));
        });

        const tagsArray = Array.from(tagSet);
        console.log("Fetched tags:", tagsArray);
        setAllTags(tagsArray);

        if (tagsArray.length === 0) {
          console.log("No tags found. Ensure questions have the 'playlists' field.");
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
        setAllTags([]);
      }
    };

    fetchTagsFromSelectedPlaylists();
  }, [selectedPlaylistIds]);

  const handleAddQuestion = () => {
    const lastQuestion = questions[questions.length - 1];
    setQuestions([
      ...questions,
      {
        questionNumber: lastQuestion.questionNumber + 1,
        question: "",
        options: ["", "", "", ""],
        correctOption: "",
        playlists: [...lastQuestion.playlists],
        tags: [...lastQuestion.tags],
        solution: "",
        questionImage: "",
        solutionImage: "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (index, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[index].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleTagsChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].tags = value.split(",").map((tag) => tag.trim());
    setQuestions(newQuestions);
  };

  const handleImageUpload = async (index, field, file) => {
    if (!file) return;
    const imageUrl = await uploadToCloudinary(file);
    if (imageUrl) {
      const newQuestions = [...questions];
      newQuestions[index][field] = imageUrl;
      setQuestions(newQuestions);
    }
  };

  const handlePlaylistSelection = (index, playlistId) => {
    const newQuestions = [...questions];
    const selectedPlaylists = newQuestions[index].playlists;

    if (selectedPlaylists.includes(playlistId)) {
      newQuestions[index].playlists = selectedPlaylists.filter((id) => id !== playlistId);
    } else {
      newQuestions[index].playlists = [...selectedPlaylists, playlistId];
    }
    setSelectedPlaylistId(newQuestions[index].playlists[0] || null);
    setQuestions(newQuestions);
  };

  const formatToBulletHTML = (text) => {
    const paragraphs = text.split(/\n\s*\n/); // Split by blank lines
    return paragraphs
      .map((para) => {
        const withLineBreaks = para.trim().replace(/\n/g, "<br />");
        return `<li>${formatInlineStyles(withLineBreaks)}</li>`;
      })
      .join("");
  };
  
  const formatInlineStyles = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/[_*](.*?)[_*]/g, "<em>$1</em>");         // Italic
  };
  

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);

      for (const question of questions) {
        if (
          !question.question ||
          !question.correctOption ||
          question.playlists.length === 0
        ) {
          alert("Please fill all fields for each question and select at least one playlist.");
          return;
        }

        const questionRef = doc(collection(db, "questions"));
        batch.set(questionRef, {
          question: question.question,
          options: question.options,
          correctOption: question.correctOption,
          createdAt: new Date(),
          isQuiz: true,
          tags: question.tags,
          solution: formatToBulletHTML(question.solution),
          questionImage: question.questionImage || "",
          solutionImage: question.solutionImage || "",
          playlists: question.playlists, // Save playlists in question
        });

        for (const playlistId of question.playlists) {
          const playlistRef = doc(db, "playlists", playlistId);
          batch.update(playlistRef, {
            questions: arrayUnion(questionRef.id),
            updatedAt: new Date(),
          });
        }
      }

      await batch.commit();

      alert("Questions added successfully!");
      setQuestions([
        {
          questionNumber: 1,
          question: "",
          options: ["", "", "", ""],
          correctOption: "",
          playlists: [],
          tags: [],
          solution: "",
          questionImage: "",
          solutionImage: "",
        },
      ]);
    } catch (error) {
      console.error("Error adding questions:", error);
      alert("Failed to add questions. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <LoadingScreen message="Submitting questions..." />;
  }

  return (
    <div className="admin-question-container">
      <h2>Add Questions</h2>
      {questions.map((q, index) => (
        <div key={index} className="question-wrapper">
          {/* Left Container: Playlists and Tags */}
          <div className="left-container">
            <h3>Playlists : {q.questionNumber}</h3>
            {Object.entries(allPlaylists).map(([type, playlists]) => (
              <div key={type} className="playlist-group">
                <h4>{type}</h4>
                <div className="playlist-cards">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`playlist-card ${
                        q.playlists.includes(playlist.id) ? "selected" : ""
                      }`}
                      onClick={() => handlePlaylistSelection(index, playlist.id)}
                    >
                      {playlist.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <h3>Tags</h3>
            <input
              type="text"
              placeholder="Add tags (comma-separated)"
              value={q.tags.join(", ")}
              onChange={(e) => handleTagsChange(index, e.target.value)}
            />
            <div className="tag-suggestions">
              {allTags.length === 0 && selectedPlaylistIds.length > 0 && (
                <p>No tags found. Ensure questions have tags and playlists field.</p>
              )}
              {allTags.map((tag) => {
                const isSelected = q.tags.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`tag-suggestion ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      const updatedQuestions = [...questions];
                      if (isSelected) {
                        updatedQuestions[index].tags = updatedQuestions[
                          index
                        ].tags.filter((t) => t !== tag);
                      } else {
                        updatedQuestions[index].tags.push(tag);
                      }
                      setQuestions(updatedQuestions);
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right Container: Question Details */}
          <div className="right-container">
            <div className="form-group">
              <label>Question : {q.questionNumber}</label>
              <textarea
                placeholder="Enter question"
                value={q.question}
                onChange={(e) => handleChange(index, "question", e.target.value)}
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>Question Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(index, "questionImage", e.target.files[0])
                }
              />
              {q.questionImage && (
                <img
                  src={q.questionImage}
                  alt="Question"
                  className="uploaded-image"
                />
              )}
            </div>
            <div className="form-group">
              <label>Options</label>
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
              <label>Correct Option</label>
              <input
                type="text"
                placeholder="Correct option (e.g., Option 1)"
                value={q.correctOption}
                onChange={(e) =>
                  handleChange(index, "correctOption", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Solution</label>
              <textarea
                placeholder="Enter solution"
                value={formatToBulletHTML(q.solution)}
                onChange={(e) => handleChange(index, "solution", e.target.value)}
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>Solution Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(index, "solutionImage", e.target.files[0])
                }
              />
              {q.solutionImage && (
                <img
                  src={q.solutionImage}
                  alt="Solution"
                  className="uploaded-image"
                />
              )}
            </div>
            <div className="action-buttons">
              <button onClick={handleAddQuestion} className="add-question-btn">
                Add Another Question
              </button>
              <button onClick={handleSubmit} className="submit-btn">
                Post Questions
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminQuestion;