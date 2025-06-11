import React, { useEffect, useState } from "react";
import "../styles/userPractise.css";
import { Card } from "../components/practise/card";
import { useNavigate } from "react-router-dom";
import { useExam } from "../contexts/ExamContext";
import { fetchPlaylistsByExam } from "../firebaseServices/playlist_services";
import LoadingScreen from "../components/loadingScreen/LoadingScreen";

const UserPractise = () => {
  const navigate = useNavigate();
  const { examName } = useExam();
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const playlists = await fetchPlaylistsByExam(examName);
        setSections(playlists);
      } catch (error) {
        console.error("Error loading playlists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examName]);

  if (!examName) {
    return (
      <div className="user-practise">
        <p>Please select an exam in Settings to view practice materials.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Loading practice materials..." />;
  }

  return (
    <div className="user-practise">
      {sections.length === 0 ? (
        <div className="no-practise-container">
          <p>No practice materials available for {examName}.</p>
        </div>
      ) : (
        sections.map((section, index) => (
          <div key={index} className="section">
            <h3 className="section-title">{section.title}</h3>
            <div className="card-container">
              {section.data.map((item, idx) => (
                <Card
                  key={idx}
                  text={`${item.name} (${item.itemCount} ${item.type === "Current-Affair" ? "PDFs" : "Questions"})`}
                  subtext={`Updated: ${item.updatedAt}`}
                  onClick={() => {
                    if (item.type === "Current-Affair") {
                      navigate("/listOfPdfs", {
                        state: { type: section.title, playlistId: item.id, pdfs: item.itemsData },
                      });
                    } else {
                      navigate("/listOfPractise", {
                        state: { type: section.title, playlistId: item.id, questions: item.itemsData },
                      });
                    }
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
