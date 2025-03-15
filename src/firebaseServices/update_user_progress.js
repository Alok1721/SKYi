import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

const updateUserProgress = async (currentUserId, newCorrectPercentage, subject, questionCreatedAt) => {
  try {
    const userDocRef = doc(db, "user_progress", currentUserId);
    const userDocSnap = await getDoc(userDocRef);
    const today = formatDate(new Date());

    const questionDate = formatDate(questionCreatedAt.toDate ? questionCreatedAt.toDate() : questionCreatedAt);

    const isTodaysPOD = subject === "POD" && questionDate === today;
    let updatedCorrectPercentage = newCorrectPercentage;
    let updatedCompletedPOD = isTodaysPOD;

    if (userDocSnap.exists()) {
      const userProgress = userDocSnap.data();
      const todayProgress = userProgress[today];

      if (todayProgress) {
        const previousCorrectPercentage = todayProgress.correctPercentage || 0;
        updatedCorrectPercentage = (previousCorrectPercentage + newCorrectPercentage) / 2;
        updatedCompletedPOD = todayProgress.completedPOD || isTodaysPOD;
      }
    }

    await setDoc(userDocRef, {
      [today]: {
        completedPOD: updatedCompletedPOD,
        correctPercentage: updatedCorrectPercentage,
      }
    }, { merge: true });

    console.log("User progress updated successfully.");
  } catch (error) {
    console.error("Error updating user progress:", error);
  }
};

export { updateUserProgress };