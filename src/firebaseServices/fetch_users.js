import { auth,db, storage } from "../firebaseConfig";  // Import your Firebase config
import { collection, query, where, getDocs, getCountFromServer,Timestamp ,getDoc,doc} from "firebase/firestore";

export const fetchUserData = async (userId) => {
  try {
   
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const querySnapshot = await getDocs(q);
    const adminList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    console.log("inside the fetch_user.js Admin List:", adminList);

    return { adminList };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {adminList:[]};
  }
};
