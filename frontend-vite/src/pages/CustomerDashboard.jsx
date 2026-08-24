import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, getToken } from "../utils/authStore";
import DashboardChatbot from "../components/DashboardChatbot";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Customer");
  const [watchedCount, setWatchedCount] = useState(0);
  const [ownedCount, setOwnedCount] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const readJSON = (keys, fallback) => {
    for (let i = 0; i < keys.length; i++) {
      const raw = localStorage.getItem(keys[i]);
      if (!raw) continue;

      try {
        return JSON.parse(raw);
      } catch (error) {
        console.error("Invalid JSON in localStorage:", keys[i], error);
      }
    }
    return fallback;
  };

  const formatTime = (ts) => {
    if (!ts) return "No time";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleString();
  };

  const loadDashboardData = async () => {
    try {
      setError("");

      const session = getSession();
      const token = getToken();
      const notifs = readJSON(["notifications", "notifs", "NOTIFS"], []);

      setUserName(session?.username || session?.name || "Customer");
      setNotifications(Array.isArray(notifs) ? notifs.slice(0, 14) : []);

      if (token) {
        const [profileRes, ownedRes, watchedRes, ticketRes] = await Promise.all([
          fetch("/api/profile/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/store/owned", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/deals/watched", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/tickets/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileData = await profileRes.json();
        const ownedData = await ownedRes.json();
        const watchedData = await watchedRes.json();
        const ticketData = await ticketRes.json();

        if (!profileRes.ok) throw new Error(profileData.message || "Failed to load profile completion");
        if (!ownedRes.ok) throw new Error(ownedData.message || "Failed to load owned games");
        if (!watchedRes.ok) throw new Error(watchedData.message || "Failed to load watched deals");
        if (!ticketRes.ok) throw new Error(ticketData.message || "Failed to load ticket stats");

        setProfileCompletion(profileData.completionPercentage || 0);
        setOwnedCount(ownedData.count || 0);
        setWatchedCount(Array.isArray(watchedData) ? watchedData.length : 0);
        setOpenTickets(ticketData.open || 0);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    }
  };

  useEffect(() => {
    loadDashboardData();

    const syncData = () => {
      loadDashboardData();
    };

    window.addEventListener("focus", syncData);
    window.addEventListener("storage", syncData);

    return () => {
      window.removeEventListener("focus", syncData);
      window.removeEventListener("storage", syncData);
    };
  }, []);

  const clearAllNotifications = () => {
    localStorage.setItem("notifications", JSON.stringify([]));
    localStorage.setItem("notifs", JSON.stringify([]));
    localStorage.setItem("NOTIFS", JSON.stringify([]));
    setNotifications([]);
  };

  const goTo = (path) => {
    navigate(path);
  };

  return (
    <>
      <header className="home-header">
        <div>
          <h1 className="home-title">🏠 Dashboard</h1>
          <p className="home-subtitle">
            Welcome back, <span>{userName}</span>. This is your customer dashboard.
          </p>
        </div>

        <div className="home-header-actions">
          <button type="button" className="primary-btn" onClick={() => goTo("/customer/store")}>
            Open Store
          </button>

          <button type="button" className="ghost-btn" onClick={() => goTo("/customer/deals")}>
            Open Deals
          </button>

          <button type="button" className="ghost-btn" onClick={() => goTo("/customer/report")}>
            Open Report
          </button>

          <button type="button" className="ghost-btn" onClick={clearAllNotifications}>
            Clear Notifications
          </button>
        </div>
      </header>

      {error && <div style={{ color: "#ff6b6b", marginBottom: "16px" }}>{error}</div>}

      <div className="home-grid">
        <div className="home-card">
          <div className="home-card-title">🔔 Recent Notifications</div>
          <div className="home-muted">From Deals • Report</div>

          {notifications.length === 0 ? (
            <div className="home-empty">
              No notifications yet. Try watching a deal or creating a ticket.
            </div>
          ) : (
            <ul className="home-notif-list">
              {notifications.map((item, index) => (
                <li key={index} className="home-notif-item">
                  <div>
                    <b>{item?.source || "System"}</b>
                    <div className="home-notif-text">{item?.text || "New activity found."}</div>
                    <div className="home-notif-meta">{formatTime(item?.ts)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="home-card">
          <div className="home-card-title">⚡ Quick Stats</div>

          <div className="home-stats-grid">
            <div className="home-stat-box">
              <span>Watched Deals</span>
              <b>{watchedCount}</b>
            </div>

            <div className="home-stat-box">
              <span>Owned Games</span>
              <b>{ownedCount}</b>
            </div>

            <div className="home-stat-box">
              <span>Open Tickets</span>
              <b>{openTickets}</b>
            </div>

            <div className="home-stat-box">
              <span>Profile Completion</span>
              <b>{profileCompletion}%</b>
            </div>
          </div>

          <div className="home-actions">
            <button type="button" className="ghost-btn" onClick={() => goTo("/customer/profile")}>
              Open Profile
            </button>

            <button type="button" className="ghost-btn" onClick={() => goTo("/customer/store")}>
              Open Store
            </button>

            <button type="button" className="ghost-btn" onClick={() => goTo("/customer/deals")}>
              Open Deals
            </button>

            <button type="button" className="ghost-btn" onClick={() => goTo("/customer/report")}>
              Open Report
            </button>
          </div>
        </div>
      </div>

      <DashboardChatbot />
    </>
  );
}