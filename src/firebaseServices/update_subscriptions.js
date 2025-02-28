import { db } from "../firebaseConfig"; // Import Firestore instance
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"; // ✅ Correct imports

export const updateUserSubscriptions = async (userId, adminId) => {
    console.log("inside updateUSerSubscription , userId:",userId);
    try {
    
    const userRef = doc(db,"users",userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists) return false;

    await updateDoc(userRef, {
        subscriptions: arrayUnion(adminId), // ✅ Efficient way to add unique values
      });

    return true;
  } catch (error) {
    console.error("Error updating subscriptions:", error);
    return false;
  }
};
