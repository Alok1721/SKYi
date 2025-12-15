import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

export const updateUserProgress = async (currentUserId, newCorrectPercentage, subject, questionCreatedAt,examName) => {
  try {
    
    if (!examName) {
      console.warn("No exam selected. Skipping user progress update.");
      return;
    }

    const today = formatDate(new Date());
    const questionDate = formatDate(questionCreatedAt.toDate ? questionCreatedAt.toDate() : questionCreatedAt);
    const isTodaysPOD =questionDate === today;//any submission will count as pod, easy to track submision at once 

    const progressRef = doc(db, `user_progress/${currentUserId}/${examName}`, today);
    const progressSnap = await getDoc(progressRef);

    let updatedCorrectPercentage = newCorrectPercentage;
    let updatedCompletedPOD = isTodaysPOD;

    if (progressSnap.exists()) {
      const existingProgress = progressSnap.data();
      const previousCorrectPercentage = existingProgress.correctPercentage || 0;
      updatedCorrectPercentage = (previousCorrectPercentage + newCorrectPercentage) / 2;
      updatedCompletedPOD = existingProgress.completedPOD || isTodaysPOD;
    }

    await setDoc(progressRef, {
      completedPOD: updatedCompletedPOD,
      correctPercentage: updatedCorrectPercentage,
      examName
    }, { merge: true });

    console.log(`User progress updated for ${examName} on ${today}.`);
  } catch (error) {
    console.error("Error updating user progress:", error);
  }
};
