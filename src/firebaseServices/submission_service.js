import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

export const fetchSubmissionsByUserId = async (userId) => {
  const q = query(
    collection(db, "submissions"),
    where("userId", "==", userId)
  );

  const snap = await getDocs(q);

  const data = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log(data);
  // ✅ SORT LOCALLY (NO INDEX NEEDED)
  return data.sort((a, b) => {
    const da = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const db = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return db - da;
  });
};
