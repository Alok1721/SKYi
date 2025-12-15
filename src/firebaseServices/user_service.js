// firebaseServices/user_service.js
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export const getUserById = async (userId) => {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data() : null;
};
