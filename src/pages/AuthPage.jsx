import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiBook, FiAward, FiUsers, FiLogIn, FiEye, FiMail } from "react-icons/fi";
import "../styles/authPage.css";

// Dummy data for guest mode
const dummyUserData = {
  uid: "guest-user",
  name: "Guest User",
  email: "guest@example.com",
  role: "user",
  createdAt: new Date(),
  subscriptions: ["prelims", "mains"],
  progress: {
    totalQuizzes: 0,
    averageScore: 0,
    completedTopics: []
  }
};

const dummyTodayChallenge = {
  id: "challenge-1",
  title: "Daily Current Affairs Quiz",
  description: "Test your knowledge of today's current affairs",
  duration: 30,
  questions: [
    {
      id: 1,
      question: "Which country recently launched its first indigenous aircraft carrier?",
      options: ["India", "China", "Russia", "USA"],
      correctAnswer: "India",
      explanation: "India launched its first indigenous aircraft carrier, INS Vikrant, in 2022."
    },
    {
      id: 2,
      question: "What is the theme of World Environment Day 2024?",
      options: ["Ecosystem Restoration", "Beat Plastic Pollution", "Only One Earth", "Air Pollution"],
      correctAnswer: "Ecosystem Restoration",
      explanation: "The theme for World Environment Day 2024 is 'Ecosystem Restoration'."
    },
    {
      id: 3,
      question: "Which Indian state recently launched the 'One District One Product' scheme?",
      options: ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu"],
      correctAnswer: "Uttar Pradesh",
      explanation: "Uttar Pradesh launched the 'One District One Product' scheme to promote local products."
    }
  ],
  totalQuestions: 3,
  passingScore: 60
};

const AuthPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const navigate = useNavigate();

  const toggleAuthMode = () => {
    setIsSignup((prev) => !prev);
    setError("");
    setVerificationSent(false);
  };

  useEffect(() => {
    const cachedUser = JSON.parse(localStorage.getItem("user"));
    if (cachedUser) {
      navigate(cachedUser.role === "admin" ? "/adminDashboard" : "/userDashboard");
    }
  }, [navigate]);

  const handleAuth = async () => {
    try {
      if (isSignup) {
        // Signup process
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Send verification email
        await sendEmailVerification(user);
        setVerificationSent(true);
        setVerificationEmail(email);
        
        // Store user data in Firestore
        const userData = { 
          uid: user.uid, 
          name, 
          email, 
          role, 
          createdAt: new Date(), 
          subscriptions: [],
          emailVerified: false
        };
        await setDoc(doc(db, "users", user.uid), userData);
        
        // Clear form
        setEmail("");
        setPassword("");
        setName("");
        setRole("user");
      } else {
        // Login process
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if email is verified
        if (!user.emailVerified) {
          setError("Please verify your email address before logging in.");
          return;
        }
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          localStorage.setItem("user", JSON.stringify(userData));
          navigate(userDoc.data().role === "admin" ? "/adminDashboard" : "/userDashboard");
        } else {
          setError("User role not found!");
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setError("Verification email has been resent. Please check your inbox.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const enterGuestMode = () => {
    // Store guest data in localStorage
    localStorage.setItem("user", JSON.stringify(dummyUserData));
    localStorage.setItem("guestMode", "true");
    localStorage.setItem("todayChallenge", JSON.stringify(dummyTodayChallenge));
    navigate("/userDashboard");
  };

  return (
    <div className="auth-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to IAS Preparation Platform</h1>
          <p>Your comprehensive solution for UPSC Civil Services Examination preparation</p>
          <div className="cta-buttons">
            <button className="cta-button" onClick={() => setShowAuthForm(true)}>
              Get Started <FiLogIn />
            </button>
            <button className="guest-button" onClick={enterGuestMode}>
              Try as Guest <FiEye />
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="feature-card">
          <FiBook className="feature-icon" />
          <h3>Comprehensive Study Material</h3>
          <p>Access high-quality study materials curated by experts</p>
        </div>
        <div className="feature-card">
          <FiAward className="feature-icon" />
          <h3>Mock Tests & Analysis</h3>
          <p>Practice with simulated tests and detailed performance analysis</p>
        </div>
        <div className="feature-card">
          <FiUsers className="feature-icon" />
          <h3>Expert Guidance</h3>
          <p>Get guidance from experienced mentors and toppers</p>
        </div>
      </div>

      {/* Auth Form Overlay */}
      {showAuthForm && (
        <div className="auth-overlay">
          <div className="auth-container">
            <button className="auth-close-button" onClick={() => setShowAuthForm(false)}>×</button>
            <h2>{isSignup ? "Sign Up" : "Login"}</h2>
            
            {error && <p className="error">{error}</p>}

            {verificationSent ? (
              <div className="verification-message">
                <FiMail className="verification-icon" />
                <h3>Verify Your Email</h3>
                <p>We've sent a verification email to {verificationEmail}</p>
                <p>Please check your inbox and click the verification link.</p>
                <button className="resend-button" onClick={resendVerificationEmail}>
                  Resend Verification Email
                </button>
                <p className="toggle-text" onClick={toggleAuthMode}>
                  Already verified? Login
                </p>
              </div>
            ) : (
              <>
                {isSignup && (
                  <input
                    type="text"
                    placeholder="Enter Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}

                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {isSignup && (
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                )}

                <button onClick={handleAuth}>{isSignup ? "Sign Up" : "Login"}</button>

                <p className="toggle-text" onClick={toggleAuthMode}>
                  {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
