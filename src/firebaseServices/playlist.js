// firebaseServices/playlist.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Fetch playlists by exam name
 */
export const fetchPlaylistsByExam = async (examName) => {
  if (!examName) return [];

  const q = query(
    collection(db, "playlists"),
    where("examName", "==", examName)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

/**
 * Create new playlist
 */
export const createPlaylist = async ({
  name,
  type,
  examName,
}) => {
  if (!name || !examName) {
    throw new Error("Playlist name and exam name are required");
  }

  return addDoc(collection(db, "playlists"), {
    name: name.trim(),
    type: type?.trim() || "",
    examName,
    pdfs: [],
    questions: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Update playlist
 */
export const updatePlaylist = async (
  playlistId,
  { name, type }
) => {
  if (!playlistId) {
    throw new Error("Playlist ID is required");
  }

  return updateDoc(doc(db, "playlists", playlistId), {
    name: name.trim(),
    type: type?.trim() || "",
    updatedAt: serverTimestamp(),
  });
};
