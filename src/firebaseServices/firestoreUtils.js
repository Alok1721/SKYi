import { db} from "../firebaseConfig";
import { doc, getDoc, updateDoc, collection } from "firebase/firestore";

export const fetchCollectionData = async (collection, docId) => {
    const ref = doc(db,collectioName,docId);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? snapshot.data() : null;
};

export const updateCollectionData = async (collectionName, docId, data) => {
    const ref = doc(db,collectionName,docId);
    await updateDoc(ref,data);
};