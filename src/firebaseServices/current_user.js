import { auth, db } from "../firebaseConfig"; // Import Firebase instances
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const getCurrentUser = async () => {
  try {
    const auth = getAuth();

    // Wait for authentication state to be determined
    const user = await new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => resolve(user));
    });

    if (!user) return null; // No authenticated user

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    return userDoc.exists() ? {id:user.uid,...userDoc.data()} : null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};
