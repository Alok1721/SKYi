import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

export const fetchPlaylistsByExam = async (examName) => {
  try {
    if (!examName) {
      console.warn("No exam selected. Returning empty playlists.");
      return [];
    }
    const playlistsQuery = query(
      collection(db, "playlists"),
      where("examName", "==", examName)
    );
    const querySnapshot = await getDocs(playlistsQuery);

    const playlists = {};

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const type = data.type || "Others";

      if (!playlists[type]) {
        playlists[type] = [];
      }

      let itemCount = 0;
      let itemsData = [];

      if (type === "Current-Affair") {
        itemCount = data.pdfs?.length || 0;
        if (data.pdfs?.length > 0) {
          const pdfPromises = data.pdfs.map(async (pdfId) => {
            const pdfDoc = await getDoc(doc(db, "pdfs", pdfId));
            return pdfDoc.exists() ? { id: pdfId, ...pdfDoc.data() } : null;
          });

          itemsData = (await Promise.all(pdfPromises)).filter((pdf) => pdf !== null);
          itemCount = itemsData.length;
        }
      } else {
        itemCount = data.questions?.length || 0;
        if (data.questions?.length > 0) {
          const questionPromises = data.questions.map(async (questionId) => {
            const questionDoc = await getDoc(doc(db, "questions", questionId));
            return questionDoc.exists() ? { id: questionId, ...questionDoc.data() } : null;
          });

          itemsData = (await Promise.all(questionPromises)).filter((q) => q !== null);
          itemCount = itemsData.length;
        }
      }

      playlists[type].push({
        id: docSnap.id,
        name: data.name,
        itemCount,
        itemsData,
        type,
        updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleString() : "N/A",
      });
    }

    // Convert playlists object to array of sections
    return Object.entries(playlists).map(([title, data]) => ({ title, data }));
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return [];
  }
};

export const fetchQuestionsByExamOptimized = async (examName) => {
  if (!examName) return [];

  try {
    // 1. Fetch all questions
    const questionSnap = await getDocs(
      query(collection(db, "questions"), where("examName", "==", examName))
    );

    // 2. Fetch playlists
    const playlistSnap = await getDocs(
      query(collection(db, "playlists"), where("examName", "==", examName))
    );

    // 3. Map playlistId → info
    const playlistMap = {};
    playlistSnap.docs.forEach((doc) => {
      const data = doc.data();
      playlistMap[doc.id] = {
        name: data.name,
        type: data.type || "Others",
      };
    });

    // 4. Group questions
    const grouped = {};

    questionSnap.docs.forEach((doc) => {
      const data = doc.data();

      (data.playlists || []).forEach((playlistId) => {
        if (!playlistMap[playlistId]) return;

        const { name, type } = playlistMap[playlistId];

        if (!grouped[type]) grouped[type] = {};
        if (!grouped[type][playlistId]) {
          grouped[type][playlistId] = {
            id: playlistId,
            name,
            type,
            itemsData: [],
          };
        }

        grouped[type][playlistId].itemsData.push({
          id: doc.id,
          ...data,
        });
      });
    });

    // 5. Format for UI
    return Object.entries(grouped).map(([title, playlists]) => ({
      title,
      data: Object.values(playlists).map((p) => ({
        ...p,
        itemCount: p.itemsData.length,
        updatedAt: "N/A",
      })),
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
};