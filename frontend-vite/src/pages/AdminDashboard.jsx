import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getSession, getToken } from "../utils/authStore";
import "../styles/admin.css";

const emptyProfile = {
  username: "",
  email: "",
  password: "",
  role: "customer",
  fullName: "",
  phone: "",
  country: "",
  city: "",
};

function money(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = getToken();
  const session = getSession();

  const [section, setSection] = useState("overview");
  const [overview, setOverview] = useState({});
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [badgeRequests, setBadgeRequests] = useState([]);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const api = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const loadAll = async () => {
    try {
      setError("");
      setMsg("");

      const [overviewData, userData, gameData, ticketData, badgeData] =
        await Promise.all([
          api("/api/admin/overview"),
          api("/api/admin/users"),
          api("/api/staff/games"),
          api("/api/tickets/staff/all"),
          api("/api/badge-requests"),
        ]);

      setOverview(overviewData);
      setUsers(Array.isArray(userData) ? userData : []);
      setGames(Array.isArray(gameData) ? gameData : []);
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setBadgeRequests(Array.isArray(badgeData.requests) ? badgeData.requests : []);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;

    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const createProfile = async (e) => {
    e.preventDefault();

    try {
      await api("/api/admin/profiles", {
        method: "POST",
        body: JSON.stringify(profileForm),
      });

      setMsg("Profile created successfully.");
      setProfileForm(emptyProfile);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to create profile");
    }
  };

  const deleteUser = async (id) => {
    try {
      await api(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      setMsg("User deleted.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to delete user");
    }
  };

  const updateGameDiscount = async (game, discount) => {
    try {
      await api(`/api/staff/games/${game._id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ discount: Number(discount) }),
      });

      setMsg("Game discount updated.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to update discount");
    }
  };

  const deleteGame = async (id) => {
    try {
      await api(`/api/staff/games/${id}`, {
        method: "DELETE",
      });

      setMsg("Game deleted.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to delete game");
    }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await api(`/api/tickets/staff/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMsg(`Ticket updated to ${status}.`);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to update ticket");
    }
  };

  const approveBadge = async (id) => {
    try {
      await api(`/api/badge-requests/${id}/approve`, {
        method: "PUT",
      });

      setMsg("Badge request approved.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to approve badge");
    }
  };

  const rejectBadge = async (id) => {
    try {
      await api(`/api/badge-requests/${id}/reject`, {
        method: "PUT",
      });

      setMsg("Badge request rejected.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to reject badge");
    }
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2 className="admin-logo">🛡️ Admin</h2>

        <ul className="admin-menu">
          {[
            ["overview", "📊 Overview"],
            ["games", "🎮 Games"],
            ["deals", "💸 Deals"],
            ["badges", "🏅 Badge Requests"],
            ["tickets", "🚩 Tickets"],
            ["profiles", "👤 Profiles"],
          ].map(([key, label]) => (
            <li
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => setSection(key)}
            >
              {label}
            </li>
          ))}
        </ul>

        <button className="admin-danger-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-page-head">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-sub">
              Logged in as {session?.username || "Admin"}. Manage users, games, badges, and tickets.
            </p>
          </div>

          <button className="admin-primary-btn" onClick={loadAll}>
            Refresh
          </button>
        </header>

        {msg && <div className="admin-ok">{msg}</div>}
        {error && <div className="admin-error">{error}</div>}

        {section === "overview" && (
          <>
            <section className="admin-stats-row">
              <div className="admin-stat-card">
                <span>Customers</span>
                <b>{overview.users || 0}</b>
              </div>
              <div className="admin-stat-card">
                <span>Staff</span>
                <b>{overview.staff || 0}</b>
              </div>
              <div className="admin-stat-card">
                <span>Games</span>
                <b>{overview.games || 0}</b>
              </div>
              <div className="admin-stat-card">
                <span>Open Tickets</span>
                <b>{overview.openTickets || 0}</b>
              </div>
            </section>

            <section className="admin-grid-2">
              <div className="admin-card">
                <h3>⚡ Quick Actions</h3>
                <div className="admin-btn-row">
                  <button className="admin-ghost-btn" onClick={() => setSection("games")}>
                    Manage Games
                  </button>
                  <button className="admin-ghost-btn" onClick={() => setSection("badges")}>
                    Review Badges
                  </button>
                  <button className="admin-ghost-btn" onClick={() => setSection("tickets")}>
                    Handle Tickets
                  </button>
                  <button className="admin-primary-btn" onClick={() => setSection("profiles")}>
                    Create Profile
                  </button>
                </div>
              </div>

              <div className="admin-card">
                <h3>📌 System Summary</h3>
                <p>Discounted Games: {overview.discountedGames || 0}</p>
                <p>Pending Badges: {overview.pendingBadges || 0}</p>
                <p>Admins: {overview.admins || 0}</p>
              </div>
            </section>
          </>
        )}

        {section === "games" && (
          <section className="admin-card">
            <div className="admin-games-head">
              <div>
                <h3>🎮 Game Management</h3>
                <p>Manage discounts, stock, sales, and remove games from MongoDB.</p>
              </div>
              <span className="admin-game-count">{games.length} Games</span>
            </div>

            <div className="admin-game-table">
              <div className="admin-game-table-head">
                <span>Game</span>
                <span>Genre</span>
                <span>Price</span>
                <span>Discount</span>
                <span>Stock</span>
                <span>Actions</span>
              </div>

              {games.map((game) => (
                <div className="admin-game-row" key={game._id}>
                  <div className="admin-game-info">
                    <div className="admin-game-cover">
                      {game.image ? <img src={game.image} alt={game.title} /> : "🎮"}
                    </div>

                    <div>
                      <h4>{game.title}</h4>
                      <p>{game.platform || "PC"} • Sold {game.sold || 0}</p>
                    </div>
                  </div>

                  <span>{game.genre}</span>

                  <span>{money(game.basePrice)}</span>

                  <span className={Number(game.discount || 0) > 0 ? "deal-on" : "deal-off"}>
                    {game.discount || 0}%
                  </span>

                  <span>{game.stock || 0}</span>

                  <div className="admin-row-actions">
                    <button
                      className="admin-ghost-btn"
                      onClick={() => updateGameDiscount(game, 0)}
                    >
                      No Deal
                    </button>

                    <button
                      className="admin-primary-btn"
                      onClick={() => updateGameDiscount(game, 25)}
                    >
                      25%
                    </button>

                    <button
                      className="admin-primary-btn"
                      onClick={() => updateGameDiscount(game, 50)}
                    >
                      50%
                    </button>

                    <button
                      className="admin-danger-btn"
                      onClick={() => deleteGame(game._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {games.length === 0 && <p>No games found.</p>}
            </div>
          </section>
        )}

        {section === "deals" && (
          <section className="admin-card">
            <h3>💸 Active Discounted Games</h3>

            <div className="admin-stack">
              {games
                .filter((g) => Number(g.discount || 0) > 0)
                .map((game) => (
                  <div className="admin-item" key={game._id}>
                    <div>
                      <h4>{game.title}</h4>
                      <p>
                        {game.discount}% off • Final Price{" "}
                        {money(game.basePrice * (1 - game.discount / 100))}
                      </p>
                    </div>

                    <button
                      className="admin-danger-btn"
                      onClick={() => updateGameDiscount(game, 0)}
                    >
                      Remove Deal
                    </button>
                  </div>
                ))}

              {games.filter((g) => Number(g.discount || 0) > 0).length === 0 && (
                <p>No active deals.</p>
              )}
            </div>
          </section>
        )}

        {section === "badges" && (
          <section className="admin-card">
            <h3>🏅 Badge Requests</h3>

            <div className="admin-stack">
              {badgeRequests.map((r) => (
                <div className="admin-item" key={r._id}>
                  <div>
                    <h4>{r.user?.username || "User"}</h4>
                    <p>Email: {r.user?.email || "N/A"}</p>
                    <p>Badge: {r.requestedBadge}</p>
                    <p>Status: {r.status}</p>
                  </div>

                  {r.status === "pending" && (
                    <div className="admin-btn-row">
                      <button className="admin-primary-btn" onClick={() => approveBadge(r._id)}>
                        Approve
                      </button>
                      <button className="admin-danger-btn" onClick={() => rejectBadge(r._id)}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {badgeRequests.length === 0 && <p>No badge requests.</p>}
            </div>
          </section>
        )}

        {section === "tickets" && (
          <section className="admin-card">
            <h3>🚩 Tickets</h3>

            <div className="admin-stack">
              {tickets.map((ticket) => (
                <div className="admin-item" key={ticket._id}>
                  <div>
                    <h4>
                      {ticket.code} • {ticket.productName}
                    </h4>
                    <p>User: {ticket.user?.username || "N/A"}</p>
                    <p>
                      Issue: {ticket.issueType} • {ticket.category}
                    </p>
                    <p>Status: {ticket.status}</p>
                    <p>{ticket.description}</p>
                  </div>

                  <div className="admin-btn-row">
                    <button
                      className="admin-ghost-btn"
                      onClick={() => updateTicketStatus(ticket._id, "Pending")}
                    >
                      Pending
                    </button>

                    <button
                      className="admin-primary-btn"
                      onClick={() => updateTicketStatus(ticket._id, "Processing")}
                    >
                      Processing
                    </button>

                    <button
                      className="admin-primary-btn"
                      onClick={() => updateTicketStatus(ticket._id, "Completed")}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              ))}

              {tickets.length === 0 && <p>No tickets found.</p>}
            </div>
          </section>
        )}

        {section === "profiles" && (
          <section className="admin-grid-2">
            <div className="admin-card">
              <h3>➕ Create Profile</h3>

              <form onSubmit={createProfile} className="admin-form">
                <label>Role</label>
                <select
                  value={profileForm.role}
                  onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>

                <label>Username</label>
                <input
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  required
                />

                <label>Email</label>
                <input
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />

                <label>Password</label>
                <input
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  required
                />

                <label>Full Name</label>
                <input
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                />

                <label>Phone</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />

                <label>Country</label>
                <input
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                />

                <label>City</label>
                <input
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                />

                <button className="admin-primary-btn" type="submit">
                  Create Verified Profile
                </button>
              </form>
            </div>

            <div className="admin-card">
              <h3>📋 Existing Profiles</h3>

              <input
                className="admin-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user/email/role..."
              />

              <div className="admin-stack">
                {filteredUsers.map((u) => (
                  <div className="admin-item" key={u._id}>
                    <div>
                      <h4>{u.username}</h4>
                      <p>{u.email}</p>
                      <p>Role: {u.role}</p>
                      <p>Completion: {u.completionPercentage || 0}%</p>
                    </div>

                    <button className="admin-danger-btn" onClick={() => deleteUser(u._id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}