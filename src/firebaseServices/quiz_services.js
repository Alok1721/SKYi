import { db ,auth} from "../firebaseConfig";
import { collection, getDoc, doc, getDocs, query, where ,updateDoc,arrayRemove,arrayUnion,addDoc} from "firebase/firestore";
import { getCurrentUser } from "./current_user";

// Function to fetch today's quizzes
export const fetchTodaysQuizzes = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.subscriptions) return [];
    
    const querySnapshot = await getDocs(collection(db, "quizzes"));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const filteredQuizzes = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((quiz) => {
        if (!quiz.createdAt || !quiz.createdBy) return false;
        if (!currentUser.subscriptions.includes(quiz.createdBy)) return false;
        
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
export const getQuizDetails = async (quizId) => {
  try {
    const quizDoc = await getDoc(doc(db, "quizzes", quizId));
    return quizDoc.exists() ? { id: quizId, ...quizDoc.data() } : null;
  } catch (error) {
    console.error("Error fetching quiz details:", error);
    return null;
  }
};

// Fetch quizzes by date, filtered by subscriptions
export const fetchQuizzesByDate = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.subscriptions) return {};
    
    const querySnapshot = await getDocs(collection(db, "quizzes"));
    const quizzes = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((quiz) => quiz.createdBy && currentUser.subscriptions.includes(quiz.createdBy));
    
    quizzes.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    return quizzes.reduce((acc, quiz) => {
      const quizDate = quiz.createdAt.toDate().toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
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
export const fetchQuizById = async (quizId) => {
  try {
    const quizDoc = await getDoc(doc(db, "quizzes", quizId));
    return quizDoc.exists() ? quizDoc.data() : null;
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return null;
  }
};


export const fetchActiveBacklogs = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.subscriptions) return {};
    const currentUserId = auth.currentUser.uid; 
    const querySnapshot = await getDocs(collection(db, "quizzes"));
    let quizzes = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((quiz) => {
        if (!quiz.createdBy || !quiz.createdAt) return false;
        const isSubscribed = currentUser.subscriptions.includes(quiz.createdBy);
        const isUnsolved = !Array.isArray(quiz.solvedBy) || !quiz.solvedBy.includes(currentUserId);
        return isSubscribed && isUnsolved; 
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
export const isQuizSolvedById = async (quizId) => {
  try {
    const currentUser=auth.currentUser;
    const currentUserId=currentUser.uid;
    const quizDocRef = doc(db, "quizzes", quizId);
    const quizDocSnap = await getDoc(quizDocRef);
    if (!quizDocSnap.exists()) {
      console.warn(`Quiz with ID ${quizId} not found.`);
      return false;
    }
    const quizData = quizDocSnap.data();
    console.log("inside qui_service  quizData",quizData);
    if (Array.isArray(quizData.solvedBy)) {
      return quizData.solvedBy.includes(currentUserId);
    } else {
      console.warn("solvedBy field is missing or not an array.");
      return false;
    }
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return null;
  }
};

export const isQuizSolvedByQuizData =(quiz) =>{
  const currentUser=auth.currentUser;
  const currentUserId=currentUser.uid;
  if(!currentUserId)return false;
  return Array.isArray(quiz.solvedBy) && quiz.solvedBy.includes(currentUserId);

}

export const submitQuizResult = async (quizId, quizResult) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");
    const currentUserId = currentUser.uid;

    const submission = {
      quizId,
      userId: currentUserId,
      timeStamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      quizResult: { ...quizResult, userId: currentUserId },
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
export const fetchUserSubmissionsByQuizId = async (userId, quizId) => {
  try {
    const submissionsRef = collection(db, "submissions");
    const q = query(
      submissionsRef,
      where("quizId", "==", quizId),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
};