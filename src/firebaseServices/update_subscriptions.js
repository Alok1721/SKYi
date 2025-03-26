import { db } from "../firebaseConfig"; // Import Firestore instance
import { doc, getDoc, updateDoc, arrayUnion , arrayRemove } from "firebase/firestore"; // ✅ Correct imports

export const updateUserSubscriptions = async (userId, adminId) => {
    console.log("inside updateUSerSubscription , userId:",userId);
    try {
    
    const userRef = doc(db,"users",userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;

    await updateDoc(userRef, {
        subscriptions: arrayUnion(adminId), // ✅ Efficient way to add unique values
      });

    return true;
  } catch (error) {
    console.error("Error updating subscriptions:", error);
    return false;
  }
};

export const toggleUserNotification = async (adminId, userId, isNotified) => {
  try {
    const adminRef = doc(db, "users", adminId);
    if (isNotified) {
      await updateDoc(adminRef, {
        subscribedUsers: arrayRemove(userId),
      });
    } else {
      await updateDoc(adminRef, {
        subscribedUsers: arrayUnion(userId),
      });
    }
    return true;
  } catch (error) {
    console.error("Error toggling notification:", error);
    return false;
  }
};
