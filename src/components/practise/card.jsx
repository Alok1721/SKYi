import React from "react";
import "./card.css";

const Card = ({ title, text ,onClick}) => {
  return (
    <div className="card" onClick={onClick}>
      <div className="badge"></div>
      <p className="card-text">{text}</p>
    </div>
  );
};

const YearCard=({title,year,noOfQuestions})=>{
    return(
        <div className="year-card">
            <div className="badge"></div>
            <p className="yearCard-title">{title}</p>
            <p className="yearCard-year">{year}</p>
            <p className="yearCard-noOfQuestions">{noOfQuestions}</p>
        </div>
    );
};

export {Card,YearCard};