import { db, auth } from "../firebaseConfig";
import { collection, getDoc, doc, getDocs, query, where, updateDoc, arrayRemove, arrayUnion, addDoc } from "firebase/firestore";
import { getCurrentUser } from "./current_user";

// Function to fetch today's quizzes
export const fetchTodaysQuizzes = async (examName) => {
  try {
    if (!examName) return [];

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.subscriptions) return [];

    const querySnapshot = await getDocs(
      query(
        collection(db, "quizzes"),
        where("examName", "==", examName),
        where("createdBy", "in", currentUser.subscriptions)
      )
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredQuizzes = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((quiz) => {
        if (!quiz.createdAt) return false;
        const quizDate = quiz.createdAt.toDate();
        quizDate.setHours(0, 0, 0, 0);
        return quizDate.getTime() === today.getTime();
      });

    return filteredQuizzes;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return [];
  }
};

// Function to fetch quiz details
export const getQuizDetails = async (quizId, examName) => {
  try {
    if (!examName) return null;

    const quizDoc = await getDoc(doc(db, "quizzes", quizId));
    if (!quizDoc.exists()) return null;

    const quizData = quizDoc.data();
    if (quizData.examName !== examName) return null;

    return { id: quizId, ...quizData };
  } catch (error) {
    console.error("Error fetching quiz details:", error);
    return null;
  }
};

// Fetch quizzes by date, filtered by subscriptions
export const fetchQuizzesByDate = async (examName) => {
  try {
    if (!examName) return {};

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.subscriptions) return {};

    const querySnapshot = await getDocs(
      query(
        collection(db, "quizzes"),
        where("examName", "==", examName),
        where("createdBy", "in", currentUser.subscriptions)
      )
    );
    const quizzes = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    quizzes.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    return quizzes.reduce((acc, quiz) => {
      const quizDate = quiz.createdAt.toDate().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      acc[quizDate] = acc[quizDate] || [];
      acc[quizDate].push(quiz);
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching quizzes by date:", error);
    return {};
  }
};

// Fetch quiz details by ID
export const fetchQuizById = async (quizId, examName) => {
  try {
    if (!examName) return null;

    const quizDoc = await getDoc(doc(db, "quizzes", quizId));
    if (!quizDoc.exists()) return null;

    const quizData = quizDoc.data();
    if (quizData.examName !== examName) return null;

    return quizData;
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return null;
  }
};

// Fetch active backlogs
export const fetchActiveBacklogs = async (examName) => {
  try {
    if (!examName) return {};

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.subscriptions) return {};
    const currentUserId = auth.currentUser.uid;

    const querySnapshot = await getDocs(
      query(
        collection(db, "quizzes"),
        where("examName", "==", examName),
        where("createdBy", "in", currentUser.subscriptions)
      )
    );
    let quizzes = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((quiz) => {
        if (!quiz.createdAt) return false;
        const isUnsolved = !Array.isArray(quiz.solvedBy) || !quiz.solvedBy.includes(currentUserId);
        return isUnsolved;
      });

    quizzes.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    return quizzes.reduce((acc, quiz) => {
      const quizDate = quiz.createdAt.toDate().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      acc[quizDate] = acc[quizDate] || [];
      acc[quizDate].push(quiz);
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching active backlogs:", error);
    return {};
  }
};

// Check if quiz is solved by ID
export const isQuizSolvedById = async (quizId, examName) => {
  try {
    if (!examName) return false;

    const currentUser = auth.currentUser;
    const currentUserId = currentUser.uid;
    const quizDocRef = doc(db, "quizzes", quizId);
    const quizDocSnap = await getDoc(quizDocRef);
    if (!quizDocSnap.exists()) {
      console.warn(`Quiz with ID ${quizId} not found.`);
      return false;
    }

    const quizData = quizDocSnap.data();
    if (quizData.examName !== examName) return false;

    return Array.isArray(quizData.solvedBy) && quizData.solvedBy.includes(currentUserId);
  } catch (error) {
    console.error("Error checking quiz status:", error);
    return false;
  }
};

// Check if quiz is solved by quiz data
export const isQuizSolvedByQuizData = (quiz, examName) => {
  if (!examName || quiz.examName !== examName) return false;

  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  if (!currentUserId) return false;

  return Array.isArray(quiz.solvedBy) && quiz.solvedBy.includes(currentUserId);
};

// Submit quiz result
export const submitQuizResult = async (quizId, quizResult, examName) => {
  try {
    if (!examName) throw new Error("No exam selected");

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");
    const currentUserId = currentUser.uid;

    const quizDoc = await getDoc(doc(db, "quizzes", quizId));
    if (!quizDoc.exists() || quizDoc.data().examName !== examName) {
      throw new Error("Quiz not found or invalid exam");
    }

    const submission = {
      quizId,
      userId: currentUserId,
      examName: examName,
      timeStamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      quizResult: { ...quizResult, userId: currentUserId }
    };
    const submissionsRef = collection(db, "submissions");
    await addDoc(submissionsRef, submission);

    console.log(`Quiz ${quizId} submission recorded for user ${currentUserId}`);
    return true;
  } catch (error) {
    console.error("Error submitting quiz result:", error);
    return false;
  }
};

// Fetch submissions by quizId and userID
export const fetchUserSubmissionsByQuizId = async (userId, quizId, examName) => {
  try {
    if (!examName) return [];

    const submissionsRef = collection(db, "submissions");
    const q = query(
      submissionsRef,
      where("quizId", "==", quizId),
      where("userId", "==", userId),
      where("examName", "==", examName)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
};
