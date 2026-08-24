import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { clearSession, getSession } from "../utils/authStore";
import "../styles/home.css";

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();

  const goTo = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="home-page">
      <Navbar />

      {session && session.role === "customer" ? (
        <div className="home-shell">
          <aside className="home-sidebar">
            <div>
              <div className="home-sidebar-brand">
                <div className="home-sidebar-badge">🎮</div>
                <h2>GameStore</h2>
              </div>

              <div className="home-sidebar-links">
                <button
                  className={`home-side-link ${
                    isActive("/customer/dashboard") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/dashboard")}
                >
                  🏠 Dashboard
                </button>

                <button
                  className={`home-side-link ${
                    isActive("/customer/store") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/store")}
                >
                  🛒 Game Store
                </button>

                <button
                  className={`home-side-link ${
                    isActive("/customer/owned-games") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/owned-games")}
                >
                  🎮 Owned Games
                </button>

                <button
                  className={`home-side-link ${
                    isActive("/customer/deals") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/deals")}
                >
                  🏷️ Deals
                </button>

                <button
                  className={`home-side-link ${
                    isActive("/customer/community-reviews") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/community-reviews")}
                >
                  ⭐ Community Reviews
                </button>

                <button
                  className={`home-side-link ${
                    isActive("/customer/report") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/report")}
                >
                  🚩 Report & Issue
                </button>

                <button
                  className={`home-side-link ${
                    isActive("/customer/mood-ai") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/mood-ai")}
                >
                  🤖 Mood-Based Search
                </button>

                <button
                  className={`home-side-link ${
                    isActive("/customer/marketplace") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/marketplace")}
                >
                  🛍️ Marketplace
                </button>

                <button
                  className={`home-side-link ${
                    isActive("/customer/profile") ? "active" : ""
                  }`}
                  onClick={() => goTo("/customer/profile")}
                >
                  👤 Profile
                </button>
              </div>
            </div>

            <button className="home-logout-btn" onClick={handleLogout}>
              ↪ Logout
            </button>
          </aside>

          <main className="home-main">
            <div className="home-container">
              <Outlet />
            </div>
          </main>
        </div>
      ) : (
        <div className="home-container">
          <div className="home-normal">
            <h1>Quivaultis ✅</h1>
            <p>Welcome to the online gaming shop.</p>

            {session ? (
              <p>
                Logged in as <b>{session.username}</b> ({session.role})
              </p>
            ) : (
              <p>Not logged in.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}