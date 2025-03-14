import React, { useEffect, useState } from "react";
import "../styles/userPractise.css";
import { Card } from "../components/practise/card";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const UserPractise = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "playlists"));
        const playlists = {};

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const type = data.type || "Others";

          if (!playlists[type]) {
            playlists[type] = [];
          }

          let questionCount = data.questions?.length || 0;
          let questionsData = [];

          if (data.questions?.length > 0) {
            const questionPromises = data.questions.map(async (questionId) => {
              const questionDoc = await getDoc(doc(db, "questions", questionId));
              return questionDoc.exists() ? { id: questionId, ...questionDoc.data() } : null;
            });

            questionsData = (await Promise.all(questionPromises)).filter((q) => q !== null);
            questionCount = questionsData.length;
          }

          playlists[type].push({
            id: docSnap.id,
            name: data.name,
            questionCount,
            questionsData, // Store fetched questions
            updatedAt: new Date(data.updatedAt?.seconds * 1000).toLocaleString(),
          });
        }

        setSections(Object.entries(playlists).map(([title, data]) => ({ title, data })));
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };

    fetchPlaylists();
  }, []);

  return (
    <div className="user-practise">
      {sections.map((section, index) => (
        <div key={index} className="section">
          <h3 className="section-title">{section.title}</h3>
          <div className="card-container">
            {section.data.map((item, idx) => (
              <Card
                key={idx}
                text={`${item.name} (${item.questionCount} Questions)`}
                subtext={`Updated: ${item.updatedAt}`}
                onClick={() => navigate("/listOfPractise", { state: { type: section.title, playlistId: item.id, questions: item.questionsData } })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserPractise;
