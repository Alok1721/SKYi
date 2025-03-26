import React from "react";

export const QuizEmailTemplate = ({ quizTitle, quizDescription, questionCount, subject }) => {
  return `
    <h2>${quizTitle || "New Quiz"}</h2>
    <p style="font-weight: bold;">${quizDescription || "Test your knowledge!"}</p>
    <br />
    <p>Subject: ${subject}</p>
    <p>Contains ${questionCount} questions</p>
    <a href="https://sky-i.netlify.app/todayChallenges" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Start Quiz
    </a>
  `;
};
export const PDFEmailTemplate = ({ quizTitle, quizDescription, questionCount, subject }) => {
  return `
    <h2>${quizTitle || "New Quiz"}</h2>
    <p>${quizDescription || "Test your knowledge!"}</p>
    <p>Subject: ${subject}</p>
    <p>Contains ${questionCount} questions</p>
    <a href="https://sky-i.netlify.app/listOfPdfs" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Check PDFs
    </a>
  `;
};


