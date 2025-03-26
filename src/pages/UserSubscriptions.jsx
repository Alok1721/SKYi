import React, { useState,useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import "../styles/userSubscriptions.css";
import ProfileCard from "../components/subscriptions/profileCard";
import {fetchUserData} from "../firebaseServices/fetch_users";
import {getCurrentUser} from "../firebaseServices/current_user";
import { getSubscribedUsers } from "../firebaseServices/firestoreUtils";


const UserSubscriptions = () => {  
    const locator=useLocation();
    const [adminList, setAdminList] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
      const getAdmins = async () => {
          const data = await fetchUserData();  // Fetch the admin data
          if (data && data.adminList) {
              setAdminList(data.adminList);
          }
      };

      const getUser=async()=>{
        const user=await getCurrentUser();  // Fetch the current user data
        setCurrentUser(user);
      }
      getUser();
      getAdmins(); 
    }, []);
    console.log("inside usersubscriptioin: currentUser",currentUser);
    return (
    <div className="user-subscriptions">
      {adminList.map((user, index) => (//here user refer to admin
        
        <ProfileCard key={index} user={user} currentUser={currentUser} />
      ))}
    </div>
  );
};

export default UserSubscriptions;
