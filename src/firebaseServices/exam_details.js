import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/* ---------------- FETCH ---------------- */

export const fetchAllExams = async () => {
  
  const snapshot = await getDocs(collection(db, "exam_details"));
  return snapshot.docs.map((doc) => doc.id);
};

export const fetchExamDetails = async (examName) => {
  const snap = await getDoc(doc(db, "exam_details", examName));
  if (!snap.exists()) return null;
  return snap.data();
};

/* ---------------- CREATE ---------------- */

export const createExam = async (examName) => {
  await setDoc(doc(db, "exam_details", examName), {
    examName,
    examDate: serverTimestamp(),
    subject: [],
  });
};

/* ---------------- UPDATE ---------------- */

export const updateExamDate = async (examName, date) => {
  await updateDoc(doc(db, "exam_details", examName), {
    examDate: Timestamp.fromDate(new Date(date)),
  });
};

export const addSubjectToExam = async (examName, subject) => {
  await updateDoc(doc(db, "exam_details", examName), {
    subject: arrayUnion(subject),
  });
};
