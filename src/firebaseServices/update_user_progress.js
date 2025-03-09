import { db } from "../firebaseConfig";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

// Function to update progress for a user
const updateUserProgress = async (currentUserId, newCorrectPercentage, subject) => {
    try {
        const userDocRef = doc(db, "user_progress", currentUserId);
        const userDocSnap = await getDoc(userDocRef);
        const today = new Date().toISOString().split("T")[0];
        
        let updatedCorrectPercentage = newCorrectPercentage;
        let updatedCompletedPOD = subject === "POD" && userDocSnap.data().createdAt == today; // Default to true if today's subject is "POD"
    
        if (userDocSnap.exists()) {
          const userProgress = userDocSnap.data();
          
          const todayProgress = userProgress[today];
          if (todayProgress) {
            updatedCorrectPercentage = (todayProgress.correctPercentage + newCorrectPercentage) / 2;
            updatedCompletedPOD = todayProgress.completedPOD || subject === "POD";
        }
        }
    
        // Update or set document
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