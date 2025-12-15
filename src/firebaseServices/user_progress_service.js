// firebaseServices/user_progress_service.js
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const getUserProgressData = async (userId, examId) => {
  if (!examId) return { graphData: [], podData: [] };

  const ref = collection(db, `user_progress/${userId}/${examId}`);
  const snap = await getDocs(ref);

  const graphData = [];
  const podData = [];

  snap.forEach((d) => {
    graphData.push({
      date: d.id,
      value: d.data().correctPercentage || 0,
    });

    podData.push({
      date: d.id,
      completedPOD: d.data().completedPOD === true,
    });
  });

  return {
    graphData: graphData.sort((a, b) => new Date(a.date) - new Date(b.date)),
    podData,
  };
};
