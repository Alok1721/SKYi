import React ,{useEffect, useState}from 'react';
import { updateUserSubscriptions } from "../../firebaseServices/update_subscriptions";
import { auth, db, storage } from "../../firebaseConfig";
import './profileCard.css';

function ProfileCard({ user,currentUser }) {
  // console.log("insideProfileCard user:",user,"currentUser:",currentUser);
  const [isSubscribed, setIsSubscribed] = useState(false);
  useEffect(() => {
    if (currentUser && currentUser.subscriptions?.includes(user.id)) {
      setIsSubscribed(true);
    }
  }, [currentUser, user]);
  const handleSubscribe = async() => {
    if(!currentUser){
      return alert("Please login to subscribe");
    }
    const updated=await updateUserSubscriptions(currentUser.id,user.id);
    if(updated){
      setIsSubscribed(true);
    }
  }

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
      </div>
    </div>
  );
}

export default ProfileCard;
