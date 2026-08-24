import { Link, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../utils/authStore";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const session = getSession();

  function logout() {
    clearSession();
    navigate("/login");
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="nav-brand" to="/">
          <span className="nav-badge">🎮</span>
          <span>Quivaultis</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          {!session ? (
            <>
              <Link to="/login">Login</Link>
              <Link className="nav-cta" to="/register">Register</Link>
            </>
          ) : (
            <>
              <span className="nav-user">
                {session.username} • {session.role}
              </span>
              <button className="nav-btn" onClick={logout}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}