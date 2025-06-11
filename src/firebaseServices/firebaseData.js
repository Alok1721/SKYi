
import { auth, db, storage } from "../firebaseConfig";
import { collection, query, where, getDocs, getCountFromServer, Timestamp, getDoc, doc } from "firebase/firestore";
import { getCurrentUser } from "./current_user";

export const fetchDashboardData = async (userId, examName) => {
  console.log("inside the firebaseData");
  console.log("examname",examName);
  try {
    if (!examName) {
      console.warn("No exam selected. Returning empty data.");
      return {
        totalQuizzes: 0,
        totalBacklogs: 0,
        todayChallenges: 0,
        daysLeft: null,
        analysisData: [],
        userName: "Guest",
        userEmail: null,
        userDpURL: "https://th.bing.com/th/id/OIP._pEcWSA6rfFIY8o1fr7YagHaHa?rs=1&pid=ImgDetMain",
        progressData: [],
        graphData: [],
        podData: []
      };
    }

    const currentUser = await getCurrentUser();
    const currentUserId = currentUser?.id;
    const subscriptions = currentUser?.subscriptions || [];
    
    if (!currentUser || subscriptions.length === 0) {
      console.warn("No subscriptions found. Skipping queries.");
      return {
        totalQuizzes: 0,
        totalBacklogs: 0,
        todayChallenges: 0,
        daysLeft: null,
        analysisData: [],
        userName: "Guest",
        userEmail: null,
        userDpURL: "https://th.bing.com/th/id/OIP._pEcWSA6rfFIY8o1fr7YagHaHa?rs=1&pid=ImgDetMain",
        progressData: [],
        graphData: [],
        podData: []
      };
    }

    const quizzesRef = collection(db, "quizzes");
    const subscribedQuery = query(
      quizzesRef,
      where("createdBy", "in", subscriptions),
      where("examName", "==", examName)
    );

    // Total Quizzes
    const quizzesSnapshot = await getCountFromServer(subscribedQuery);
    const totalQuizzes = quizzesSnapshot.data().count;
    console.log("total_count_quiz",quizzesSnapshot);
    // Total Backlogs (Quiz unsolved)
    const backlogsQuery = query(subscribedQuery, where("solvedBy", "array-contains", currentUserId));
    const backlogsSnapshot = await getCountFromServer(backlogsQuery);
    const totalSolved = backlogsSnapshot.data().count;
    const totalBacklogs = totalQuizzes - totalSolved;
    console.log("total_backlog",totalBacklogs);
    // Today's Challenges
    const now = new Date();
    const startOfDay = Timestamp.fromDate(new Date(now.setHours(0, 0, 0, 0)));
    const endOfDay = Timestamp.fromDate(new Date(now.setHours(23, 59, 59, 999)));
    const todayChallengesSnapshot = await getDocs(subscribedQuery);
    const todayChallenges = todayChallengesSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt;
      return createdAt >= startOfDay && createdAt <= endOfDay;
    }).length;

    // Days Left for Selected Exam
    let daysLeft = null;
    const examDocRef = doc(db, "exam_details", examName);
    const examDocSnap = await getDoc(examDocRef);
    if (examDocSnap.exists()) {
      const examData = examDocSnap.data().examDate.toDate();
      const today = new Date();
      examData.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = examData - today;
      daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
    }
    // console.log("exam_daysLeft",daysLeft);

    // Fetch User Info
    let userName = "Guest";
    let userEmail = null;
    let userDpURL = "https://th.bing.com/th/id/OIP._pEcWSA6rfFIY8o1fr7YagHaHa?rs=1&pid=ImgDetMain";
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      userName = userDocSnap.data().name;
      userEmail = userDocSnap.data().email;
      userDpURL = userDocSnap.data().photoURL || userDpURL;
    }

    // Fetch Quiz Data for User
    const quizQuery = query(
      collection(db, "quizzes"),
      where("solvedBy", "array-contains", currentUserId),
      where("createdBy", "in", subscriptions),
      where("examName", "==", examName)
    );
    const quizSnapshot = await getDocs(quizQuery);
    const subjectMap = {};
    quizSnapshot.docs.forEach((doc) => {
      const quizData = doc.data();
      const subject = quizData.subject || "Mixed";
      const correctPercentage = quizData.correctPercentage || 0;
      if (!subjectMap[subject]) {
        subjectMap[subject] = { totalPercentage: 0, count: 0 };
      }
      subjectMap[subject].totalPercentage += correctPercentage;
      subjectMap[subject].count += 1;
    });

    const progressData = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      averageCorrectPercentage: data.count > 0 ? data.totalPercentage / data.count : 0,
    }));

    // Fetch User Progress
    const userProgressRef = collection(db, `user_progress/${userId}/${examName}`);
    const userProgressSnap = await getDocs(userProgressRef);
    let graphData = [];
    let podData = [];
    if (!userProgressSnap.empty) {
      graphData = userProgressSnap.docs
        .map((doc) => ({
          date: doc.id,
          value: doc.data().correctPercentage || 0
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      podData = userProgressSnap.docs
        .map((doc) => ({
          date: doc.id,
          completedPOD: doc.data().completedPOD || false
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    const analysisData = [];
    return { totalQuizzes, totalBacklogs, todayChallenges, daysLeft, analysisData, userName, userEmail, userDpURL, progressData, graphData, podData };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
};
