import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getSession } from "../utils/authStore";
import "../styles/home.css";

export default function Home() {
  const session = getSession();

  if (session?.role === "customer") {
    return <Navigate to="/customer/dashboard" replace />;
  }

  if (session?.role === "staff") {
    return <Navigate to="/staff" replace />;
  }

  if (session?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="home-page">
      <Navbar />

      <div className="home-container">
        <div className="home-normal">
          <h1>Quivaultis ✅</h1>
          <p>Welcome to the online gaming shop.</p>
          <p>Please login to continue.</p>
        </div>
      </div>
    </div>
  );
}