import React, { useState,useEffect } from "react";
import "../styles/adminQuizMaker.css";
import { db,auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../cloudinaryServices/cloudinary_services";
import {sendBrevoEmail} from "../emailServices/emailFunctions";
import { getSubscribedUsers } from "../firebaseServices/firestoreUtils";
import { QuizEmailTemplate } from "../emailServices/emailTemplates";
import LoadingScreen from "../components/loadingScreen/LoadingScreen";

const AdminQuizMaker = () => {
  const [questions, setQuestions] = useState([
    { 
      question: "", 
      questionImage:"",
      options: ["", "", "", ""], 
      correctOption: "", 
      solution: "",
      solutionImage:""
    },
  ]);
  const subjectTimeMap = {
    "POD": 5, 
    "Geography": 3,
    "Economics": 3,
    "History": 3,
    "Political Science": 3,
    "Science & Technology": 3,
    "Environment": 3,
    "Current Affairs": 3,
    "Mixed": 3,
    "Media":10,

  };
  const [message, setMessage] = useState(""); // To show success/error messages
  const [quizTitle, setQuizTitle] = useState("");
  const [isQuiz, setIsQuiz] = useState(true);
  const [quizDescription, setQuizDescription] = useState("");
  const [questionSubject, setQuestionSubject] = useState("Mixed");
  const [timeAllocated, setTimeAllocated] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const extraTimePerQuestion = 3;
  const currentUser = auth.currentUser;
  const currentUserId = currentUser.uid;
  useEffect(() => {
    if (!isManual) {
      calculateTime();
    }
  }, [questionSubject, questions.length]);
  const calculateTime = () => {
    if (questionSubject in subjectTimeMap) {
      const baseTime = subjectTimeMap[questionSubject]||3;
      const extraTime = questions.length * extraTimePerQuestion; // Example: 2 min per extra question
      setTimeAllocated(baseTime + extraTime);
    }
  };

  const handleChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    if (field === "options") {
      updatedQuestions[index].options = value;
    } else {
      updatedQuestions[index][field] = value;
    }
    setQuestions(updatedQuestions);
  };

  const handleImageUpload =async (index,field,file)=>{
    if(!file)return ;
    const imageUrl=await uploadToCloudinary(file);
    console.log("image url",imageUrl);
    if(imageUrl)
    {
      handleChange(index,field,imageUrl);
    }
  }
  const addNewQuestion = () => {
    setQuestions([
      ...questions,
      { question: "",questionImage:"", options: ["", "", "", ""], correctOption: "", solution: "",solutionImage:"" },
    ]);
  };

  const sendQuizNotification = async () => {
    try {
      const recipients = await getSubscribedUsers();
      const emailBody = QuizEmailTemplate({
        quizTitle,
        quizDescription,
        questionCount: questions.length,
        subject: questionSubject,
      });
      return await sendBrevoEmail(
        recipients,
        `New ${questionSubject} Quiz Available!`,
        emailBody
      );
    } catch (error) {
      console.error("Error sending notification:", error);
      return { success: false };
    }
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
  
  const handlePostQuiz = async () => {
    setIsSubmitting(true);
    try {
      if (questions.length === 0 || !questions.some((q) => q.question.trim() || q.questionImage)) {
        setMessage("Please enter at least one question!");
        return;
      }
      const formattedQuestions = questions.map((question) => ({
        ...question,
        solution: question.solution ? `<ul>${formatToBulletHTML(question.solution)}</ul>` : "",
      }));
      
      sendQuizNotification().then(result => {
        if (!result.success) {
          console.warn("Email notification failed");
        }
        else{
          console.log("Email notification sent successfully");
        }
      });
     
      await addDoc(collection(db, "quizzes"), {
        questions: formattedQuestions,
        createdAt: new Date(),
        subject: questionSubject,
        quizDescription: quizDescription,
        quizStatus:false,
        isQuiz: isQuiz,
        timeAllocated:timeAllocated,
        createdBy: currentUserId,
      });

      setMessage("Quiz posted successfully!");
      setQuestions([{ question: "", questionImage:"",options: ["", "", "", ""], correctOption: "", solution: "",solutionImage:"" }]); // Reset form
      setTimeAllocated(0);
      setIsManual(false);
    } catch (error) {
      console.error("Error posting quiz:", error);
      setMessage("Failed to post quiz. Try again.");
    }
    finally {
      setIsSubmitting(false);
    }
  };
  if (isSubmitting) {
    return <LoadingScreen message="Submitting questions..." />;
  }

  return (
    <div className="qm-quiz-container">
      <h2>Admin Quiz Maker</h2>
      {message && <p className="qm-message">{message}</p>}

      {questions.map((q, index) => (
        <div key={index} className="qm-question-box">
          <h3>Question {index + 1}</h3>
          <label>Subject:</label>
        <select value={questionSubject} onChange={(e) => 
          { setIsManual(false);
            setQuestionSubject(e.target.value)}}>
        {["POD","Geography", "Economics", "History", "Political Science", "Science & Technology", "Environment", "Current Affairs", "Mixed","Media","TEST"]
            .map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
        ))}
        </select>
        <br /><label>
            Is Quiz? 
            <input
              type="checkbox"
              checked={isQuiz}
              onChange={(e) => setIsQuiz(e.target.checked)}
            />
          </label>
          <br />
            <label>Quiz Description:</label>
            <textarea
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
            placeholder="Enter Quiz Description"
            />
        <br />
        <label> Time Allocated(minutes): </label>
        <input type="number" value={timeAllocated} onChange={(e)=>{
          setTimeAllocated(Number(e.target.value));
          setIsManual(true);
        }}/>


        <br />
        <label>Enter the Question:</label>
          <textarea
            value={q.question}
            onChange={(e) => handleChange(index, "question", e.target.value)}
            placeholder="Enter your question"
          />
          <label>Upload Question Image:</label>
          <input type="file" onChange={(e) => handleImageUpload(index, "questionImage", e.target.files[0])} />

          <div className="qm-options">
            {q.options.map((option, optIndex) => (
              <input
                key={optIndex}
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...q.options];
                  newOptions[optIndex] = e.target.value;
                  handleChange(index, "options", newOptions);
                }}
                placeholder={`Option ${optIndex + 1}`}
              />
            ))}
          </div>

          <label>Correct Option:</label>
          <input
            type="text"
            value={q.correctOption}
            onChange={(e) => handleChange(index, "correctOption", e.target.value)}
            placeholder="Correct Option"
          />

          <label>Solution:</label>
          <textarea
            value={q.solution}
            onChange={(e) => handleChange(index, "solution", e.target.value)}
            placeholder="Enter your solution"
          />
          <label>Upload Solution Image:</label>
          <input type="file" onChange={(e) => handleImageUpload(index, "solutionImage", e.target.files[0])} />
        </div>
      ))}

      <button className="qm-add-btn" onClick={addNewQuestion}>
        + Add New Question
      </button>
      <button className="qm-post-btn" onClick={handlePostQuiz}>
        POST
      </button>
    </div>
  );
};

export default AdminQuizMaker;
