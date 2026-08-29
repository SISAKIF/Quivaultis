import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/authStore";
import "../styles/deals.css";

function coverSvg(title, genre, c1 = "#06b6d4", c2 = "#7c3aed") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <rect width="900" height="520" rx="28" fill="#0b1120"/>
      <rect x="18" y="18" width="864" height="484" rx="24" fill="url(#g)" opacity="0.92"/>
      <text x="52" y="120" fill="#e5f7ff" font-size="22" font-family="Arial" font-weight="700">${genre}</text>
      <text x="52" y="220" fill="#ffffff" font-size="46" font-family="Arial" font-weight="900">${title}</text>
      <text x="52" y="280" fill="#dbeafe" font-size="18" font-family="Arial">Discount Deal</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function money(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

function finalPrice(game) {
  return +(game.basePrice * (1 - game.discount / 100)).toFixed(2);
}

export default function Deals() {
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);
  const [watchedIds, setWatchedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("best");
  const [howOpen, setHowOpen] = useState(false);

  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return JSON.parse(localStorage.getItem("deal_alerts_enabled") || "true");
  });

  const [threshold, setThreshold] = useState(() => {
    return localStorage.getItem("deal_alert_threshold") || "10";
  });

  const [settingsMsg, setSettingsMsg] = useState("");
  const [notifications, setNotifications] = useState([]);

  const token = getToken();

  const pushNotif = (source, text) => {
    const item = {
      source,
      text,
      ts: Date.now(),
    };

    setNotifications((prev) => [item, ...prev].slice(0, 8));

    const old = JSON.parse(localStorage.getItem("notifications") || "[]");
    localStorage.setItem("notifications", JSON.stringify([item, ...old].slice(0, 20)));
  };

  const loadDeals = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/deals");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load deals");
      }

      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  const loadWatched = async () => {
    try {
      if (!token) return;

      const res = await fetch("/api/deals/watched", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load watched deals");
      }

      const ids = data.map((item) => String(item.game?._id || item.game));
      setWatchedIds(ids);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    loadDeals();
    loadWatched();
  }, []);

  const filteredDeals = useMemo(() => {
    let list = [...deals];

    if (search.trim()) {
      list = list.filter((game) =>
        game.title.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    list.sort((a, b) => {
      if (sort === "best") return Number(b.discount || 0) - Number(a.discount || 0);
      if (sort === "low") return finalPrice(a) - finalPrice(b);
      if (sort === "high") return finalPrice(b) - finalPrice(a);
      if (sort === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
      return String(b._id).localeCompare(String(a._id));
    });

    return list;
  }, [deals, search, sort]);

  const toggleWatch = async (game) => {
    try {
      if (!token) {
        setError("Please login first.");
        return;
      }

      const res = await fetch("/api/deals/watch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId: game._id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update watched deal");
      }

      if (data.watched) {
        setWatchedIds((prev) => [...new Set([...prev, String(game._id)])]);
        pushNotif("Deals", `Watching deal: ${game.title}`);
      } else {
        setWatchedIds((prev) => prev.filter((id) => id !== String(game._id)));
        pushNotif("Deals", `Removed from watched: ${game.title}`);
      }
    } catch (err) {
      setError(err.message || "Failed to update watched deal");
    }
  };

  const clearAllWatched = async () => {
    try {
      if (!token) {
        setError("Please login first.");
        return;
      }

      const res = await fetch("/api/deals/watched", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to clear watched deals");
      }

      setWatchedIds([]);
      pushNotif("Deals", "Cleared watched list.");
    } catch (err) {
      setError(err.message || "Failed to clear watched deals");
    }
  };

  const saveAlertSettings = () => {
    localStorage.setItem("deal_alerts_enabled", JSON.stringify(alertsEnabled));
    localStorage.setItem("deal_alert_threshold", threshold);

    setSettingsMsg("✅ Alert settings saved.");
    pushNotif(
      "Deals",
      `Alerts ${alertsEnabled ? "enabled" : "disabled"} • Threshold ${threshold}%+`
    );
  };

  return (
    <section id="section-deals" className="app-section deals-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">💸 Discounts & Deals</h1>
          <p className="page-sub">
            Only games with active discounts appear here. Watch deals to get notified later.
          </p>
        </div>

        <div className="head-actions">
          <button className="ghost-btn" type="button" onClick={() => setHowOpen(true)}>
            How it works
          </button>

          <button
            className="primary-btn"
            type="button"
            onClick={() => navigate("/customer/dashboard")}
          >
            ⬅ Back to Dashboard
          </button>
        </div>
      </header>

      {error && <div style={{ color: "#ff6b6b", marginBottom: 16 }}>{error}</div>}

      <section className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Deals Live</div>
          <div className="stat-value">{deals.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Watched</div>
          <div className="stat-value">{watchedIds.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Alerts</div>
          <div className="stat-value">{alertsEnabled ? "On" : "Off"}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Threshold</div>
          <div className="stat-value">{threshold}%</div>
        </div>
      </section>

      <section className="card settings-card">
        <div className="card-head">
          <div>
            <h2>🔔 Price Drop Alerts</h2>
            <p className="tiny">Watch games to get notified on your dashboard.</p>
          </div>

          <label className="switch" title="Enable/Disable alerts">
            <input
              type="checkbox"
              checked={alertsEnabled}
              onChange={(e) => setAlertsEnabled(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-row">
          <div className="field">
            <label>Alert when price drops by</label>
            <select value={threshold} onChange={(e) => setThreshold(e.target.value)}>
              <option value="5">5%+</option>
              <option value="10">10%+</option>
              <option value="15">15%+</option>
              <option value="20">20%+</option>
              <option value="30">30%+</option>
            </select>
          </div>

          <div className="field">
            <label>&nbsp;</label>
            <div className="btn-row">
              <button className="primary-btn" type="button" onClick={saveAlertSettings}>
                Save
              </button>

              <button className="danger-btn" type="button" onClick={clearAllWatched}>
                Clear Watched
              </button>
            </div>
          </div>
        </div>

        <div className="msg">{settingsMsg}</div>
      </section>

      <section className="card feed-head">
        <div className="feed-left">
          <h2>🔥 Discounted Games</h2>
          <span className="tiny">Browse active deals, watch items, and open store.</span>
        </div>

        <div className="controls">
          <div className="input-wrap">
            <span className="icon">🔎</span>
            <input
              type="text"
              placeholder="Search discounted games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="best">Best Deal</option>
            <option value="new">Newest</option>
            <option value="low">Lowest Price</option>
            <option value="high">Highest Price</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </section>

      <section className="discount-grid">
        {loading ? (
          <div className="empty">
            <b>Loading deals...</b>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="empty">
            <b>No discounted games found.</b>
            <div className="tiny muted">Try another search or check Store.</div>
          </div>
        ) : (
          filteredDeals.map((game) => {
            const fp = finalPrice(game);
            const watched = watchedIds.includes(String(game._id));
            const c1 = game.colors?.[0] || "#06b6d4";
            const c2 = game.colors?.[1] || "#7c3aed";

            return (
              <div className="discount-card" key={game._id}>
                <img src={coverSvg(game.title, game.genre, c1, c2)} alt={game.title} />

                <div className="card-body">
                  <h3 className="card-title">{game.title}</h3>

                  <div className="badges">
                    <span className="badge hot">-{game.discount}%</span>
                    <span className="badge">{game.genre}</span>
                    <span className="badge">⭐ {game.rating}</span>
                    <span className="badge">{game.playtime}</span>
                  </div>

                  <div className="price-row">
                    <div>
                      <div className="old-price">{money(game.basePrice)}</div>
                      <div className="new-price">{money(fp)}</div>
                    </div>

                    <div className="tiny muted">Save {money(game.basePrice - fp)}</div>
                  </div>

                  <div className="card-actions">
                    <button
                      className={`watch-btn ${watched ? "on" : ""}`}
                      type="button"
                      onClick={() => toggleWatch(game)}
                    >
                      {watched ? "Watching" : "Watch"}
                    </button>

                    <button
                      className="view-btn"
                      type="button"
                      onClick={() => navigate("/customer/store")}
                    >
                      View Store
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <aside className="notification-panel">
        <div className="panel-header">
          <h4>🔔 Notifications</h4>
          <span className="panel-badge">{notifications.length}</span>
        </div>

        <ul className="panel-list">
          {notifications.length === 0 ? (
            <li className="notif-empty">No notifications yet.</li>
          ) : (
            notifications.map((item, index) => (
              <li key={index}>
                <b>{item.source}</b>
                <br />
                {item.text}
              </li>
            ))
          )}
        </ul>
      </aside>

      <div className={`modal-overlay ${howOpen ? "show" : ""}`} aria-hidden={!howOpen}>
        <div className="modal">
          <div className="modal-header">
            <h3>ℹ️ How Discounts work</h3>
            <button
              className="modal-close"
              type="button"
              onClick={() => setHowOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="info-grid">
              <div className="info-card">
                <h4>1) Deals list</h4>
                <p>Only games where discount is greater than 0 appear here.</p>
              </div>

              <div className="info-card">
                <h4>2) Watch list</h4>
                <p>Watching a game saves it to MongoDB for the logged-in customer.</p>
              </div>

              <div className="info-card">
                <h4>3) Alerts settings</h4>
                <p>Alert settings are saved in localStorage for now.</p>
              </div>
            </div>

            <div className="note">
              ✅ Deals are connected with your existing Store database.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}