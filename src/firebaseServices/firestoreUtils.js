import { db,auth} from "../firebaseConfig";
import { query, where, getDocs,doc, getDoc, updateDoc, collection } from "firebase/firestore";

export const fetchCollectionData = async (collection, docId) => {
    const ref = doc(db,collectionName,docId);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? snapshot.data() : null;
};

export const updateCollectionData = async (collectionName, docId, data) => {
    const ref = doc(db,collectionName,docId);
    await updateDoc(ref,data);
};

// export const getSubscribedUsers = async () => {
//     try {
//       const currentUser = auth.currentUser;
//       const currentUserId = currentUser.uid;
//       const adminDocRef = doc(db, "users", currentUserId);
//       const adminDocSnap = await getDoc(adminDocRef);
//       if (adminDocSnap.exists()) {
//         const adminData = adminDocSnap.data();
//         return adminData.subscribedUsers || []; // Return the array or empty array if not exists
//       }
//       return [];
//     } catch (error) {
//       console.error("Error fetching subscribed users:", error);
//       return [];
//     }
//   };
export const getSubscribedUsers = async () => {
  console.log("inside getSubscribedUsers");

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No authenticated user found.");
      return [];
    }

    const currentUserId = currentUser.uid;
    console.log("Fetching data for admin user ID:", currentUserId);

    const adminDocRef = doc(db, "users", currentUserId);
    const adminDocSnap = await getDoc(adminDocRef);

    if (!adminDocSnap.exists()) {
      console.warn("Admin document not found.");
      return [];
    }

    const adminData = adminDocSnap.data();
    const subscribedUserIds = adminData.subscribedUsers || [];
    console.log("Subscribed Users in Firestore:", adminData);

    if (subscribedUserIds.length === 0) {
      console.log("No subscribed users found.");
      return [];
    }

    console.log("Subscribed user IDs:", subscribedUserIds);

    const usersCollection = collection(db, "users");

    // Split queries if IDs > 10
    let subscribedEmails = [];
    for (let i = 0; i < subscribedUserIds.length; i += 10) {
      const batch = subscribedUserIds.slice(i, i + 10);
      const userQuery = query(usersCollection, where("__name__", "in", batch));
      const userDocs = await getDocs(userQuery);
      const batchEmails = userDocs.docs.map(doc => doc.data().email).filter(email => email);
      subscribedEmails = [...subscribedEmails, ...batchEmails];
    }

    console.log("subscribedEmails", subscribedEmails);
    return subscribedEmails;
  } catch (error) {
    console.error("Error fetching subscribed users:", error);
    return [];
  }
};