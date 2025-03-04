import { auth,db, storage } from "../firebaseConfig";  // Import your Firebase config
import { collection, query, where, getDocs, getCountFromServer,Timestamp ,getDoc,doc} from "firebase/firestore";
import { getCurrentUser } from "./current_user";

export const fetchDashboardData = async (userId) => {
  try {
    const currentUser = await getCurrentUser();
    const currentUserId=currentUser.id;
    const subscriptions = currentUser?.subscriptions || [];
    if (!currentUser || subscriptions.length === 0) {
      console.warn("No subscriptions found. Skipping queries.");
      return {
        totalQuizzes: 0,
        totalBacklogs: 0,
        todayChallenges: 0,
        daysLeftIAS: null,
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
    const subscribedQuery = query(quizzesRef, where("createdBy", "in",subscriptions));
    
    // Total Quizzes
    const quizzesSnapshot = await getCountFromServer(subscribedQuery);
    const totalQuizzes =quizzesSnapshot.data().count;

    // Total Backlogs (Quiz unsolved)
    const backlogsQuery = query(subscribedQuery, where("solvedBy", "array-contains",currentUserId));
    const backlogsSnapshot = await getCountFromServer(backlogsQuery);
    const totalSolved = backlogsSnapshot.data().count;
    const totalBacklogs=totalQuizzes-totalSolved;

    // Today's Challenges (created today)
    const now = new Date();
    const startOfDay = Timestamp.fromDate(new Date(now.setHours(0, 0, 0, 0))); // Midnight
    const endOfDay = Timestamp.fromDate(new Date(now.setHours(23, 59, 59, 999))); // 11:59:59 PM
    
    const todayChallengesSnapshot = await getDocs(query(quizzesRef, where("createdBy", "in", currentUser.subscriptions)));
    const todayChallenges = todayChallengesSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt;
      return createdAt >= startOfDay && createdAt <= endOfDay;
    }).length;
    // // Fetch Analysis Data
    // const analysisSnapshot = await getDocs(collection(db, "users", userId, "analysis"));
    // const analysisData = analysisSnapshot.docs.map(doc => doc.data());
    let daysLeftIAS=null;
    const examDocRef=doc(db,"exam_details","IAS");
    const examDocSnap=await getDoc(examDocRef);
    if(examDocSnap.exists()){

      const examData=examDocSnap.data().examDate.toDate();
      const today=new Date();
      examData.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime=examData-today;
   
      daysLeftIAS=Math.ceil(diffTime/(1000*3600*24));
    }

    //fetch user Info(Name & email)
    let userName="Guest";
    let userEmail=null;
    let userDpURL="https://th.bing.com/th/id/OIP._pEcWSA6rfFIY8o1fr7YagHaHa?rs=1&pid=ImgDetMain";
    const userDocRef=doc(db,"users",userId);
    const userDocSnap=await getDoc(userDocRef);
    
    if(userDocSnap.exists()){ 
      userName=userDocSnap.data().name;
      userEmail=userDocSnap.data().email;
      userDpURL=userDocSnap.data().photoURL;
    }

    //Fetch Quiz Data for User
    const quizQuery=query(collection(db,"quizzes"),where("solvedBy", "array-contains", currentUserId),where("createdBy", "in", currentUser.subscriptions));
    const quizSnapshot = await getDocs(quizQuery);
    const subjectMap = {}; // { subject: { totalPercentage: X, count: Y } }
    
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
    //fetch user progress
    const userProgressRef=doc(db,"user_progress",userId);
    const userProgressSnap=await getDoc(userProgressRef);
    const today = new Date().toISOString().split("T")[0];
    let graphData=[];
    let podData=[];
    if (userProgressSnap.exists()) {
      const userProgress = userProgressSnap.data();
      graphData = Object.keys(userProgress)
        .map((date) => ({
          date, // Date as key
          value: userProgress[date].correctPercentage, 
        }))
        .filter((entry) => entry.value !== undefined)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      podData = Object.keys(userProgress)
        .map((date) => ({
          date, // Date as key
          completedPOD: userProgress[date].completedPOD, 
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        // console.log("graphData",graphData);
        // console.log("graphData",podData);
         
    }
    // console.log("graphData",graphData);
    // console.log("graphData",podData);
    const analysisData = [];
    return { totalQuizzes, totalBacklogs, todayChallenges,daysLeftIAS, analysisData,userName,userEmail ,userDpURL,progressData,graphData,podData };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
};
