import React ,{useEffect, useState}from 'react';
import { updateUserSubscriptions, toggleUserNotification} from "../../firebaseServices/update_subscriptions";
import { auth, db, storage } from "../../firebaseConfig";
import './profileCard.css';

export const ProfileCard = ({ user, currentUser }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

  useEffect(() => {
      if (currentUser && currentUser.subscriptions?.includes(user.id)) {
          setIsSubscribed(true);
      }
      if (currentUser && user.subscribedUsers?.includes(currentUser.id)) {
          setIsNotified(true); 
      }
  }, [currentUser, user]);
  
  const handleSubscribe = async() => {
      if (!currentUser || !user?.id) {
          return alert("Please login to subscribe");
      }
      const updated = await updateUserSubscriptions(currentUser.id, user.id, isSubscribed);
      if(updated) {
          setIsSubscribed(!isSubscribed);
          // If unsubscribing, also turn off notifications
          if (isSubscribed && isNotified) {
              await toggleUserNotification(user.id, currentUser.id, true);
              setIsNotified(false);
          }
      }
  }

  const handleToggleNotification = async () => {
      if (!currentUser || !user?.id) {
          return alert("Please login to manage notifications");
      }
      // Can only toggle notifications if subscribed
      if (!isSubscribed) return;
      
      const updated = await toggleUserNotification(user.id, currentUser.id, isNotified);
      if (updated) {
          setIsNotified(!isNotified);
      }
  };

  return (
      <div className="user-card">
          <div className="profile-pic">
              <img
                  src={user.profilePic || "https://picsum.photos/50"}
                  alt="User"
              />
          </div>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <div className="actions">
              <button 
                  className={`profile-btn ${isSubscribed ? "subscribed" : ""}`}
                  onClick={handleSubscribe}
              >
                  {isSubscribed ? "Unsubscribe" : "Subscribe"}
              </button>

              {isSubscribed && (
                  <button
                      className={`notification-toggle-${isNotified ? "on" : "off"}`}
                      onClick={handleToggleNotification}
                  >
                      🔔 {isNotified ? "On" : "Off"}
                  </button>
              )}
          </div>
      </div>
  );
}