import { signOut } from "firebase/auth";

const handleLogout = async () => {
  try {
    await signOut(auth);
    navigate("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
