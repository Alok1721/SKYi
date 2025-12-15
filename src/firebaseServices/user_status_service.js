// firebaseServices/user_status_service.js
import { realtimeDB } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";

/**
 * Subscribe to user's online status
 * @param {string} userId
 * @param {function} callback
 * @returns unsubscribe function
 */
export const subscribeUserStatus = (userId, callback) => {
  const statusRef = ref(realtimeDB, `status/${userId}`);

  return onValue(statusRef, (snapshot) => {
    const data = snapshot.val();
    callback({
      isOnline: data?.isOnline ?? false,
      lastActive: data?.lastActive ?? null,
    });
  });
};
