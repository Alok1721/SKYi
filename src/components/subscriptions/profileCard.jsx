import React ,{useEffect, useState}from 'react';
import { updateUserSubscriptions, toggleUserNotification} from "../../firebaseServices/update_subscriptions";
import { auth, db, storage } from "../../firebaseConfig";
import './profileCard.css';

function ProfileCard({ user,currentUser }) {
  // console.log("insideProfileCard user:",user,"currentUser:",currentUser);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isNotified,setIsNotified]=useState(false);

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
    const updated=await updateUserSubscriptions(currentUser.id,user.id);
    if(updated){
      setIsSubscribed(true);
    }
  }
  const handleToggleNotification = async () => {
    if (!currentUser || !user?.id) {
      return alert("Please login to manage notifications");
    }
    const updated = await toggleUserNotification(user.id, currentUser.id, isNotified);
    if (updated) {
      setIsNotified(!isNotified);
    }
  };

  // console.log("user:",user);
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
        <button className={`profile-btn ${isSubscribed ?"subscribed":""}`}
        onClick={handleSubscribe}
        disabled={isSubscribed}
        >{isSubscribed ? "Subscribed" : "Subscribe"}</button>

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

export default ProfileCard;
