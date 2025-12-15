import { db } from "../firebaseConfig";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
export const getAdminDefaultExam = async () => {
  console.log("inside the adminExamNameFetch");
    try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No authenticated user.");
      return "";
    }
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    console.log("check examName",userDocSnap.data().examName);
    return userDocSnap.exists() ? userDocSnap.data().examName : "";
  } catch (error) {
    console.error("Error fetching default exam:", error);
    return "";
  }
};

export const getSubjectsByExamName = async (examName) => {
  if (!examName) {
    console.error("No exam name provided.");
    return [];
  }

  try {
    const examDocRef = doc(db, "exam_details", examName);
    const examDocSnap = await getDoc(examDocRef);

    if (examDocSnap.exists()) {
      const data = examDocSnap.data();
      return data.subject || [];
    } else {
      console.warn(`Exam '${examName}' not found in exam_details.`);
      return [];
    }
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
};


/**
 * Fetch subscribers for an admin
 */
export const getAdminSubscribers = async (adminId) => {
  if (!adminId) return [];
  const adminSnap = await getDoc(doc(db, "users", adminId));
  if (!adminSnap.exists()) return [];
  const { subscribedUsers = [] } = adminSnap.data();
  if (subscribedUsers.length === 0) return [];
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("__name__", "in", subscribedUsers.slice(0, 10)));

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};
