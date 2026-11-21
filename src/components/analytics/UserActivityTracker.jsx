import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, increment, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

const UserActivityTracker = () => {
  useEffect(() => {
    let stopActiveSession = () => {};

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      stopActiveSession();
      if (!user) return;

      let lastCountedAt = Date.now();
      let pendingSeconds = 0;
      let isPaused = document.visibilityState === "hidden";
      let isSaving = false;

      const flushTime = () => {
        if (!isPaused) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastCountedAt) / 1000);
          pendingSeconds += elapsedSeconds;
          lastCountedAt += elapsedSeconds * 1000;
        }

        if (!pendingSeconds || isSaving) return;
        isSaving = true;
        const secondsToSave = pendingSeconds;
        let saved = false;
        updateDoc(doc(db, "users", user.uid), {
          totalTimeSpentSeconds: increment(secondsToSave),
        })
          .then(() => {
            pendingSeconds -= secondsToSave;
            saved = true;
          })
          .catch((error) => {
            console.error("Unable to save user activity time:", error);
          })
          .finally(() => {
            isSaving = false;
            if (saved && pendingSeconds >= 60) flushTime();
          });
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          flushTime();
          isPaused = true;
        } else {
          lastCountedAt = Date.now();
          isPaused = false;
        }
      };

      const timer = window.setInterval(flushTime, 60_000);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("pagehide", flushTime);

      stopActiveSession = () => {
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("pagehide", flushTime);
        flushTime();
      };
    });

    return () => {
      stopActiveSession();
      unsubscribe();
    };
  }, []);

  return null;
};

export default UserActivityTracker;
