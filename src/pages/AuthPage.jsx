// src/pages/AuthPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { setDoc, doc, getDoc, collection, getDocs } from "firebase/firestore";
import { ref, set, onDisconnect, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiTarget,
  FiZap,
  FiLogIn,
  FiEye,
  FiMail,
  FiCheckCircle,
  FiTrendingUp,
  FiAward,
  FiUsers,
  FiStar,
} from "react-icons/fi";
import "../styles/authPage.css";
import LoadingScreen from "../components/loadingScreen/LoadingScreen";

/* ==================== PARTICLE BACKGROUND ==================== */
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 50; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 1,
        opacity: Math.random() * 0.4 + 0.2,
      });
    }

    const drawLines = () => {
      particles.current.forEach((p1, i) => {
        particles.current.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(160, 234, 255, ${Math.max(0, (150 - dist) / 150 * 0.1)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLines();

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
};

/* ==================== DUMMY DATA ==================== */
const dummyUserData = {
  uid: "guest-user",
  name: "Guest User",
  email: "guest@example.com",
  role: "user",
  createdAt: new Date(),
  examName: "UPSC",
  subscriptions: ["upsc", "ssc"],
  progress: { totalQuizzes: 0, averageScore: 0, completedTopics: [] },
};

const dummyTodayChallenge = {}; // keep your challenge structure here

/* ==================== MAIN COMPONENT ==================== */
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
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showAuthForm || !isSignup) return;

    const fetchExams = async () => {
      try {
        const snapshot = await getDocs(collection(db, "exam_details"));
        const list = snapshot.docs.map((doc) => doc.id);
        setExams(list.length > 0 ? list : ["UPSC", "SSC", "Banking", "Railways"]);
      } catch {
        setExams(["UPSC", "SSC", "Banking", "Railways"]);
      }
    };
    fetchExams();
  }, [showAuthForm, isSignup]);

  useEffect(() => {
    const cachedUser = JSON.parse(localStorage.getItem("user"));
    if (cachedUser) {
      navigate(cachedUser.role === "admin" ? "/adminDashboard" : "/userDashboard");
    }
  }, [navigate]);

  const toggleAuthMode = () => {
    setIsSignup((prev) => !prev);
    setError("");
    setVerificationSent(false);
  };

  const setUserOnline = (uid) => {
    const connectedRef = ref(realtimeDB, ".info/connected");
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        const statusRef = ref(realtimeDB, `status/${uid}`);
        set(statusRef, { isOnline: true, lastActive: new Date().toISOString() });
        onDisconnect(statusRef).set({
          isOnline: false,
          lastActive: new Date().toISOString(),
        });
      }
    });
  };

  const handleAuth = async () => {
    setIsUserLoading(true);
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        setVerificationSent(true);
        setVerificationEmail(email);

        const userData = {
          uid: user.uid,
          name,
          email,
          role,
          createdAt: new Date(),
          examName: exams[0] || "UPSC",
          subscriptions: [],
          emailVerified: false,
        };
        await setDoc(doc(db, "users", user.uid), userData);

        setEmail("");
        setPassword("");
        setName("");
        setRole("user");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (!user.emailVerified) {
          setError("Please verify your email before logging in.");
          return;
        }
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          localStorage.setItem("user", JSON.stringify(userData));
          setUserOnline(user.uid);
          navigate(userData.role === "admin" ? "/adminDashboard" : "/userDashboard");
        } else {
          setError("User data not found!");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsUserLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setError("Verification email resent!");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const enterGuestMode = () => {
    localStorage.setItem("user", JSON.stringify(dummyUserData));
    localStorage.setItem("guestMode", "true");
    localStorage.setItem("todayChallenge", JSON.stringify(dummyTodayChallenge));
    navigate("/userDashboard");
  };

  if (isUserLoading) {
    return <LoadingScreen message={isSignup ? "Creating your account..." : "Logging in..."} />;
  }

  return (
    <div className="auth-page ultra-dark">
      <ParticleBackground />

      {/* Navbar */}
      <nav className="auth-navbar">
        <div className="navbar-logo">
          <FiStar className="logo-icon" />
          <span>SKY-i</span>
        </div>
        <div className="navbar-actions">
          <button className="nav-button login-btn" onClick={() => { setIsSignup(false); setShowAuthForm(true); }}>
            <FiLogIn /> Login
          </button>
          <button className="nav-button signup-btn" onClick={() => { setIsSignup(true); setShowAuthForm(true); }}>
            <FiLogIn /> Sign Up
          </button>
          <button className="nav-button guest-btn" onClick={enterGuestMode}>
            <FiEye /> Guest Mode
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Master Your Exams with <span className="highlight">Focused Preparation</span>
          </h1>
          <p className="hero-subtitle">
            Daily PDFs • Subject-wise Playlists • Smart Quizzes • Progress Tracking • Details Analytics
            <br />
            Designed for UPSC, SSC, Banking, IIT, Gate, & more.
          </p>

          <div className="features-grid">
            <div className="feature-item">
              <FiBookOpen className="feature-icon" />
              <h3>Daily PDFs</h3>
              <p>Fresh updates on current affairs</p>
            </div>
            <div className="feature-item">
              <FiTarget className="feature-icon" />
              <h3>Subject Playlists</h3>
              <p>Organized questions and notes</p>
            </div>
            <div className="feature-item">
              <FiZap className="feature-icon" />
              <h3>Smart Quizzes</h3>
              <p>Identify and improve weak areas</p>
            </div>
            <div className="feature-item">
              <FiTrendingUp className="feature-icon" />
              <h3>Performance Insights</h3>
              <p>Track your growth effectively</p>
            </div>
          </div>
          <div className="trust-badges">
            <span><FiCheckCircle /> 20+ Active Students</span>
            <span><FiAward /> Trusted by Rank Holders</span>
            <span><FiUsers /> Multiple Exams</span>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-item"><h2>5K+</h2><p>Practice Questions</p></div>
        <div className="stat-item"><h2>150+</h2><p>Daily PDFs</p></div>
        <div className="stat-item"><h2>98%</h2><p>User Satisfaction</p></div>
      </div>

      {showAuthForm && (
        <div className="auth-overlay" onClick={() => setShowAuthForm(false)}>
          <div className="auth-container modern-form" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close-button" onClick={() => setShowAuthForm(false)}>×</button>
            <h2>{isSignup ? "Sign Up" : "Login"}</h2>
            <p className="form-subtitle">
              {isSignup ? "Create your account" : "Continue your preparation"}
            </p>

            {error && <p className="error">{error}</p>}

            {verificationSent ? (
              <div className="verification-message">
                <FiMail className="verification-icon" />
                <h3>Check Your Email</h3>
                <p>Verification link sent to <strong>{verificationEmail}</strong></p>
                <button className="resend-button" onClick={resendVerificationEmail}>
                  Resend Email
                </button>
                <p className="toggle-text" onClick={toggleAuthMode}>
                  Already verified? Login
                </p>
              </div>
            ) : (
              <>
                {isSignup && (
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                )}
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
                {isSignup && (
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">Aspirant</option>
                    <option value="admin">Admin (Restricted)</option>
                  </select>
                )}
                <button className="auth-submit-btn" onClick={handleAuth}>
                  {isSignup ? "Sign Up" : "Login"}
                </button>
                <p className="toggle-text" onClick={toggleAuthMode}>
                  {isSignup ? "Already have an account? Login" : "New here? Sign Up"}
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
