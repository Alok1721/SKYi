import React, { useEffect, useState } from "react";
import "../styles/userPractise.css";
import { Card } from "../components/practise/card";
import { useNavigate } from "react-router-dom";
import { useExam } from "../contexts/ExamContext";
import { fetchQuestionsByExamOptimized } from "../firebaseServices/playlist_services";
import LoadingScreen from "../components/loadingScreen/LoadingScreen";

const UserPractise = () => {
  const navigate = useNavigate();
  const { examName } = useExam();

  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!examName) return;

        setIsLoading(true);

        // 🔥 Optimized fetch (only 2 queries total)
        const data = await fetchQuestionsByExamOptimized(examName);

        setSections(data);
      } catch (error) {
        console.error("Error loading questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examName]);

  // ❗ No exam selected
  if (!examName) {
    return (
      <div className="user-practise">
        <p>Please select an exam in Settings to view practice materials.</p>
      </div>
    );
  }

  // ⏳ Loading state
  if (isLoading) {
    return <LoadingScreen message="Loading practice questions..." />;
  }

  return (
    <div className="user-practise">
      {sections.length === 0 ? (
        <div className="no-practise-container">
          <p>No practice questions available for {examName}.</p>
        </div>
      ) : (
        sections.map((section, index) => (
          <div key={index} className="section">
            <h3 className="section-title">{section.title}</h3>

            <div className="card-container">
              {section.data.map((item, idx) => (
                <Card
                  key={idx}
                  text={`${item.name} (${item.itemCount} Questions)`}
                  subtext={`Questions available: ${item.itemCount}`}
                  onClick={() => {
                    navigate("/listOfPractise", {
                      state: {
                        type: section.title,
                        playlistId: item.id,
                        questions: item.itemsData, // 🔥 Already available (no extra fetch)
                      },
                    });
                  }}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserPractise;