import { db } from "../firebaseConfig";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

const updateUserProgress = async (currentUserId, newCorrectPercentage, subject,questionCreatedAt) => {
    try {
        const userDocRef = doc(db, "user_progress", currentUserId);
        const userDocSnap = await getDoc(userDocRef);
        const today = formatDate(new Date());
        const createdAtDate = questionCreatedAt.toDate();
        const questionDate = formatDate(createdAtDate);

        const isTodaysPOD = subject === "POD" && questionDate === today;
        let updatedCorrectPercentage = newCorrectPercentage;
        let updatedCompletedPOD = isTodaysPOD;
    
        if (userDocSnap.exists()) {
          const userProgress = userDocSnap.data();
          const todayProgress = userProgress[today];
          if (todayProgress) {
            updatedCorrectPercentage = (todayProgress.correctPercentage + newCorrectPercentage) / 2;
            updatedCompletedPOD = todayProgress.completedPOD || isTodaysPOD;
        }
        }
        await setDoc(userDocRef, {
          [today]:{completedPOD: updatedCompletedPOD,
          correctPercentage: updatedCorrectPercentage,}
        }, { merge: true });
    
        console.log("User progress updated successfully.");
      } catch (error) {
        console.error("Error updating user progress:", error);
      }
};
export { updateUserProgress }; 