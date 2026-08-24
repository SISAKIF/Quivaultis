import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getSession, getToken } from "../utils/authStore";
import "../styles/staff.css";

const emptyGame = {
  title: "",
  studio: "",
  genre: "",
  platform: "PC",
  playtime: "Medium",
  basePrice: "",
  discount: 0,
  rating: 4.5,
  difficulty: "Medium",
  stock: 10,
  sold: 0,
  image: "",
  description: "",
  tags: "",
  moodTags: "",
};

function money(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const token = getToken();
  const session = getSession();

  const [section, setSection] = useState("overview");
  const [games, setGames] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [gameForm, setGameForm] = useState(emptyGame);
  const [editingGameId, setEditingGameId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
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

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  const loadAll = async () => {
    try {
      setError("");
      setMessage("");

      const [gameData, ticketData, badgeData] = await Promise.all([
        api("/api/staff/games"),
        api("/api/tickets/staff/all"),
        api("/api/badge-requests"),
      ]);

      setGames(Array.isArray(gameData) ? gameData : []);
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setRequests(Array.isArray(badgeData.requests) ? badgeData.requests : []);
    } catch (err) {
      setError(err.message || "Failed to load staff data");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const searchQuery = search.toLowerCase().trim();

  const filteredGames = useMemo(() => {
    if (!searchQuery) return games;

    return games.filter(
      (g) =>
        g.title?.toLowerCase().includes(searchQuery) ||
        g.studio?.toLowerCase().includes(searchQuery) ||
        g.genre?.toLowerCase().includes(searchQuery) ||
        g.platform?.toLowerCase().includes(searchQuery) ||
        g.playtime?.toLowerCase().includes(searchQuery) ||
        g.difficulty?.toLowerCase().includes(searchQuery) ||
        g.description?.toLowerCase().includes(searchQuery)
    );
  }, [games, searchQuery]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets;

    return tickets.filter(
      (t) =>
        t.code?.toLowerCase().includes(searchQuery) ||
        t.productName?.toLowerCase().includes(searchQuery) ||
        t.category?.toLowerCase().includes(searchQuery) ||
        t.issueType?.toLowerCase().includes(searchQuery) ||
        t.orderId?.toLowerCase().includes(searchQuery) ||
        t.status?.toLowerCase().includes(searchQuery) ||
        t.description?.toLowerCase().includes(searchQuery) ||
        t.user?.username?.toLowerCase().includes(searchQuery) ||
        t.user?.email?.toLowerCase().includes(searchQuery)
    );
  }, [tickets, searchQuery]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery) return requests;

    return requests.filter(
      (r) =>
        r.user?.username?.toLowerCase().includes(searchQuery) ||
        r.user?.email?.toLowerCase().includes(searchQuery) ||
        r.requestedBadge?.toLowerCase().includes(searchQuery) ||
        r.status?.toLowerCase().includes(searchQuery)
    );
  }, [requests, searchQuery]);

  const stats = useMemo(() => {
    const totalStock = games.reduce((sum, g) => sum + Number(g.stock || 0), 0);
    const totalSold = games.reduce((sum, g) => sum + Number(g.sold || 0), 0);
    const revenue = games.reduce(
      (sum, g) => sum + Number(g.sold || 0) * Number(g.basePrice || 0),
      0
    );
    const openTickets = tickets.filter((t) => t.status !== "Completed").length;

    return { totalStock, totalSold, revenue, openTickets };
  }, [games, tickets]);

  const handleImage = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setGameForm((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const saveGame = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const payload = {
        ...gameForm,
        basePrice: Number(gameForm.basePrice),
        discount: Number(gameForm.discount || 0),
        rating: Number(gameForm.rating || 4.5),
        stock: Number(gameForm.stock || 0),
        sold: Number(gameForm.sold || 0),
        tags: gameForm.tags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        moodTags: gameForm.moodTags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };

      if (editingGameId) {
        await api(`/api/staff/games/${editingGameId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setMessage("Game updated successfully.");
      } else {
        await api("/api/staff/games", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage("Game added successfully.");
      }

      setGameForm(emptyGame);
      setEditingGameId(null);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to save game");
    }
  };

  const editGame = (game) => {
    setEditingGameId(game._id);
    setGameForm({
      title: game.title || "",
      studio: game.studio || "",
      genre: game.genre || "",
      platform: game.platform || "PC",
      playtime: game.playtime || "Medium",
      basePrice: game.basePrice || "",
      discount: game.discount || 0,
      rating: game.rating || 4.5,
      difficulty: game.difficulty || "Medium",
      stock: game.stock || 0,
      sold: game.sold || 0,
      image: game.image || "",
      description: game.description || "",
      tags: Array.isArray(game.tags) ? game.tags.join(", ") : "",
      moodTags: Array.isArray(game.moodTags) ? game.moodTags.join(", ") : "",
    });

    setSection("games");
  };

  const deleteGame = async (id) => {
    try {
      await api(`/api/staff/games/${id}`, {
        method: "DELETE",
      });

      setMessage("Game deleted.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to delete game");
    }
  };

  const updateGameQuick = async (game, patch) => {
    try {
      await api(`/api/staff/games/${game._id}/stock`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });

      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to update game");
    }
  };

  const approveBadge = async (id) => {
    try {
      await api(`/api/badge-requests/${id}/approve`, {
        method: "PUT",
      });

      setMessage("Badge request approved.");
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

      setMessage("Badge request rejected.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to reject badge");
    }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await api(`/api/tickets/staff/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMessage(`Ticket updated to ${status}.`);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to update ticket");
    }
  };

  const sendStaffReply = async (id) => {
    try {
      const text = replyText[id];

      if (!text || !text.trim()) {
        setError("Reply cannot be empty.");
        return;
      }

      await api(`/api/tickets/staff/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      setReplyText({ ...replyText, [id]: "" });
      setMessage("Reply sent.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to send reply");
    }
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">🎮</div>
          <div>
            <h2>GameStore</h2>
            <p className="sub">Staff Panel</p>
          </div>
        </div>

        <div className="staff-card">
          <div className="avatar">🛡️</div>
          <div className="staff-meta">
            <div className="name">{session?.username || "Staff"}</div>
            <div className="status">
              <span className="dot"></span> Online
            </div>
          </div>
        </div>

        <ul className="menu">
          {[
            ["overview", "📊 Overview"],
            ["games", "🎮 Add / Manage Games"],
            ["badges", "🏅 Badge Requests"],
            ["reports", "🚩 Reports & Issues"],
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

        <div className="sidebar-foot">
          <button className="btn ghost" onClick={loadAll}>
            🔄 Refresh
          </button>
          <button className="btn danger" onClick={logout}>
            Logout
          </button>
          <p className="tiny">MongoDB connected staff panel</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="search">
            <span>🔎</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games, reports, badges..."
            />
          </div>

          <div className="topbar-actions">
            <button className="btn" onClick={loadAll}>
              Refresh
            </button>
          </div>
        </header>

        {message && <div style={{ color: "#00e676", marginBottom: 12 }}>{message}</div>}
        {error && <div style={{ color: "#ff6b6b", marginBottom: 12 }}>{error}</div>}

        {section === "overview" && (
          <section className="content-section active">
            <div className="grid-3">
              <div className="card stat">
                <div className="stat-icon">🎮</div>
                <div>
                  <div className="stat-value">{games.length}</div>
                  <div className="stat-label">Games in Store</div>
                </div>
              </div>

              <div className="card stat">
                <div className="stat-icon green">📦</div>
                <div>
                  <div className="stat-value">{stats.totalStock}</div>
                  <div className="stat-label">Total Stock Keys</div>
                </div>
              </div>

              <div className="card stat">
                <div className="stat-icon pink">🚩</div>
                <div>
                  <div className="stat-value">{stats.openTickets}</div>
                  <div className="stat-label">Open Reports</div>
                </div>
              </div>
            </div>

            <div className="grid-3">
              <div className="card stat">
                <div className="stat-icon">🛒</div>
                <div>
                  <div className="stat-value">{stats.totalSold}</div>
                  <div className="stat-label">Total Sold</div>
                </div>
              </div>

              <div className="card stat">
                <div className="stat-icon green">💰</div>
                <div>
                  <div className="stat-value">{money(stats.revenue)}</div>
                  <div className="stat-label">Revenue</div>
                </div>
              </div>

              <div className="card stat">
                <div className="stat-icon pink">🏅</div>
                <div>
                  <div className="stat-value">{requests.length}</div>
                  <div className="stat-label">Badge Requests</div>
                </div>
              </div>
            </div>

            {searchQuery && (
              <div className="card">
                <div className="card-head">
                  <h3>Search Results</h3>
                  <span className="chip">"{search}"</span>
                </div>

                <div className="grid-3">
                  <div className="item">
                    <div className="meta">
                      <div className="title">🎮 Games</div>
                      <div className="time">{filteredGames.length}</div>
                    </div>
                    <div className="desc">
                      {filteredGames.slice(0, 3).map((g) => (
                        <div key={g._id}>
                          {g.title} • {g.genre}
                        </div>
                      ))}
                      {filteredGames.length === 0 && "No matching games."}
                    </div>
                    <button
                      className="btn ghost"
                      style={{ marginTop: 10 }}
                      onClick={() => setSection("games")}
                    >
                      Open Games
                    </button>
                  </div>

                  <div className="item">
                    <div className="meta">
                      <div className="title">🚩 Reports</div>
                      <div className="time">{filteredTickets.length}</div>
                    </div>
                    <div className="desc">
                      {filteredTickets.slice(0, 3).map((t) => (
                        <div key={t._id}>
                          {t.code} • {t.productName}
                        </div>
                      ))}
                      {filteredTickets.length === 0 && "No matching reports."}
                    </div>
                    <button
                      className="btn ghost"
                      style={{ marginTop: 10 }}
                      onClick={() => setSection("reports")}
                    >
                      Open Reports
                    </button>
                  </div>

                  <div className="item">
                    <div className="meta">
                      <div className="title">🏅 Badges</div>
                      <div className="time">{filteredRequests.length}</div>
                    </div>
                    <div className="desc">
                      {filteredRequests.slice(0, 3).map((r) => (
                        <div key={r._id}>
                          {r.user?.username || "User"} • {r.status}
                        </div>
                      ))}
                      {filteredRequests.length === 0 && "No matching badge requests."}
                    </div>
                    <button
                      className="btn ghost"
                      style={{ marginTop: 10 }}
                      onClick={() => setSection("badges")}
                    >
                      Open Badges
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-head">
                <h3>Quick Actions</h3>
                <span className="chip">Staff Tools</span>
              </div>

              <div className="quick-actions">
                <button className="qa" onClick={() => setSection("games")}>
                  ➕ Add New Game
                </button>
                <button className="qa" onClick={() => setSection("badges")}>
                  🏅 Review Badge Requests
                </button>
                <button className="qa" onClick={() => setSection("reports")}>
                  🚩 Handle Reports
                </button>
              </div>
            </div>
          </section>
        )}

        {section === "games" && (
          <section className="content-section active">
            <div className="card">
              <div className="card-head">
                <h3>{editingGameId ? "Edit Game" : "Add New Game"}</h3>
                <span className="chip">Game Management</span>
              </div>

              <form className="form" onSubmit={saveGame}>
                <div className="grid-2">
                  <div className="field">
                    <label>Game Title</label>
                    <input
                      value={gameForm.title}
                      onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Publisher / Studio</label>
                    <input
                      value={gameForm.studio}
                      onChange={(e) => setGameForm({ ...gameForm, studio: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="field">
                    <label>Genre</label>
                    <input
                      value={gameForm.genre}
                      onChange={(e) => setGameForm({ ...gameForm, genre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Platform</label>
                    <select
                      value={gameForm.platform}
                      onChange={(e) => setGameForm({ ...gameForm, platform: e.target.value })}
                    >
                      <option>PC</option>
                      <option>PlayStation</option>
                      <option>Xbox</option>
                      <option>Nintendo</option>
                      <option>Mobile</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={gameForm.basePrice}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, basePrice: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="field">
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      value={gameForm.discount}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, discount: e.target.value })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Stock</label>
                    <input
                      type="number"
                      value={gameForm.stock}
                      onChange={(e) => setGameForm({ ...gameForm, stock: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label>Sold</label>
                    <input
                      type="number"
                      value={gameForm.sold}
                      onChange={(e) => setGameForm({ ...gameForm, sold: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Difficulty</label>
                    <select
                      value={gameForm.difficulty}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, difficulty: e.target.value })
                      }
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Playtime</label>
                    <select
                      value={gameForm.playtime}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, playtime: e.target.value })
                      }
                    >
                      <option>Short</option>
                      <option>Medium</option>
                      <option>Long</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Tags</label>
                    <input
                      value={gameForm.tags}
                      onChange={(e) => setGameForm({ ...gameForm, tags: e.target.value })}
                      placeholder="Action, Story, RPG"
                    />
                  </div>

                  <div className="field">
                    <label>Mood Tags</label>
                    <input
                      value={gameForm.moodTags}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, moodTags: e.target.value })
                      }
                      placeholder="story, challenge, relaxed"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Cover Image Upload</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImage(e.target.files?.[0])}
                    />
                  </div>

                  <div className="field">
                    <label>Preview</label>
                    <div className="preview-box">
                      {gameForm.image ? (
                        <img
                          src={gameForm.image}
                          alt="preview"
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: "cover",
                            borderRadius: 12,
                          }}
                        />
                      ) : (
                        <span className="preview-muted">No image selected</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label>Description</label>
                  <textarea
                    value={gameForm.description}
                    onChange={(e) =>
                      setGameForm({ ...gameForm, description: e.target.value })
                    }
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button className="btn" type="submit">
                    Save Game
                  </button>

                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      setGameForm(emptyGame);
                      setEditingGameId(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Games List</h3>
                <span className="chip">{filteredGames.length}</span>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Genre</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Stock</th>
                      <th>Sold</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGames.map((game) => (
                      <tr key={game._id}>
                        <td>{game.title}</td>
                        <td>{game.genre}</td>
                        <td>{money(game.basePrice)}</td>
                        <td>{game.discount || 0}%</td>
                        <td>{game.stock || 0}</td>
                        <td>{game.sold || 0}</td>
                        <td>
                          <div className="actions">
                            <button className="btn ghost" onClick={() => editGame(game)}>
                              Edit
                            </button>

                            <button
                              className="btn ghost"
                              onClick={() =>
                                updateGameQuick(game, {
                                  stock: Number(game.stock || 0) + 1,
                                })
                              }
                            >
                              +Stock
                            </button>

                            <button
                              className="btn ghost"
                              onClick={() =>
                                updateGameQuick(game, {
                                  stock: Math.max(0, Number(game.stock || 0) - 1),
                                })
                              }
                            >
                              -Stock
                            </button>

                            <button
                              className="btn ghost"
                              onClick={() =>
                                updateGameQuick(game, {
                                  sold: Number(game.sold || 0) + 1,
                                  stock: Math.max(0, Number(game.stock || 0) - 1),
                                })
                              }
                            >
                              Sold +1
                            </button>

                            <button className="btn danger" onClick={() => deleteGame(game._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredGames.length === 0 && (
                      <tr>
                        <td colSpan="7">No games found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {section === "badges" && (
          <section className="content-section active">
            <div className="card">
              <div className="card-head">
                <h3>Badge Requests</h3>
                <span className="chip">{filteredRequests.length}</span>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Completion</th>
                      <th>Badge</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r._id}>
                        <td>{r.user?.username || "N/A"}</td>
                        <td>{r.user?.email || "N/A"}</td>
                        <td>{r.user?.completionPercentage || 0}%</td>
                        <td>{r.requestedBadge}</td>
                        <td>{r.status}</td>
                        <td>
                          {r.status === "pending" ? (
                            <div className="actions">
                              <button className="btn" onClick={() => approveBadge(r._id)}>
                                Approve
                              </button>
                              <button className="btn danger" onClick={() => rejectBadge(r._id)}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            "Done"
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan="6">No badge requests.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {section === "reports" && (
          <section className="content-section active">
            <div className="card">
              <div className="card-head">
                <h3>Reports & Issues Queue</h3>
                <span className="chip">{filteredTickets.length}</span>
              </div>

              <div className="list">
                {filteredTickets.map((ticket) => (
                  <div className="item" key={ticket._id}>
                    <div className="meta">
                      <div className="title">
                        {ticket.code} • {ticket.productName}
                      </div>
                      <div className="time">{ticket.status}</div>
                    </div>

                    <div className="desc">
                      <b>User:</b> {ticket.user?.username || "N/A"} |{" "}
                      <b>Email:</b> {ticket.user?.email || "N/A"} <br />
                      <b>Issue:</b> {ticket.issueType} • {ticket.category} <br />
                      <b>Order:</b> {ticket.orderId} <br />
                      <b>Description:</b> {ticket.description}
                    </div>

                    <div className="actions" style={{ marginTop: 12 }}>
                      <button
                        className="btn ghost"
                        onClick={() => updateTicketStatus(ticket._id, "Pending")}
                      >
                        Pending
                      </button>

                      <button
                        className="btn ghost"
                        onClick={() => updateTicketStatus(ticket._id, "Processing")}
                      >
                        Processing
                      </button>

                      <button
                        className="btn"
                        onClick={() => updateTicketStatus(ticket._id, "Completed")}
                      >
                        Completed
                      </button>
                    </div>

                    <div className="field" style={{ marginTop: 12 }}>
                      <label>Staff Reply</label>
                      <textarea
                        value={replyText[ticket._id] || ""}
                        onChange={(e) =>
                          setReplyText({ ...replyText, [ticket._id]: e.target.value })
                        }
                        rows="2"
                        placeholder="Write reply..."
                      />
                    </div>

                    <button className="btn" onClick={() => sendStaffReply(ticket._id)}>
                      Send Reply
                    </button>
                  </div>
                ))}

                {filteredTickets.length === 0 && (
                  <div className="item">No reports found.</div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}