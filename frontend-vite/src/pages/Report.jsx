import { useEffect, useMemo, useRef, useState } from "react";
import { getToken } from "../utils/authStore";
import "../styles/report.css";

const keyCategories = [
  "Invalid key",
  "Region lock",
  "Already used key",
  "Key delivery delay",
  "Account/Wallet issue",
  "Other",
];

const diskCategories = [
  "Disk not reading",
  "Scratched disk",
  "Install stuck",
  "Performance issue",
  "Other",
];

function formatTime(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString();
}

export default function Report() {
  const formRef = useRef(null);
  const token = getToken();

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    open: 0,
  });

  const [form, setForm] = useState({
    issueType: "key",
    category: "Invalid key",
    orderId: "",
    productName: "",
    platform: "PS5",
    region: "BD",
    priority: "Normal",
    description: "",
    contactEmail: "",
    attachment: "",
    confirm: false,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("new");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [howOpen, setHowOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [notifications, setNotifications] = useState([]);

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

  const pushNotif = (source, text) => {
    const item = { source, text, ts: Date.now() };
    setNotifications((prev) => [item, ...prev].slice(0, 10));

    try {
      const old = JSON.parse(localStorage.getItem("notifications") || "[]");
      localStorage.setItem("notifications", JSON.stringify([item, ...old].slice(0, 20)));
    } catch {
      localStorage.setItem("notifications", JSON.stringify([item]));
    }
  };

  const loadTickets = async () => {
    try {
      setError("");

      const [ticketData, statData] = await Promise.all([
        api("/api/tickets"),
        api("/api/tickets/stats"),
      ]);

      setTickets(ticketData);
      setStats(statData);
    } catch (err) {
      setError(err.message || "Failed to load tickets");
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const categories = form.issueType === "disk" ? diskCategories : keyCategories;

  const filteredTickets = useMemo(() => {
    let list = [...tickets];

    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const hay = `${t.code} ${t.productName} ${t.orderId} ${t.category}`.toLowerCase();
        return hay.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortMode === "old") return new Date(a.createdAt) - new Date(b.createdAt);

      if (sortMode === "priority") {
        const p = { Urgent: 3, High: 2, Normal: 1 };
        return (p[b.priority] || 0) - (p[a.priority] || 0);
      }

      if (sortMode === "status") {
        const s = { Pending: 1, Processing: 2, Completed: 3 };
        return (s[a.status] || 0) - (s[b.status] || 0);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [tickets, search, statusFilter, sortMode]);

  const handleIssueTypeChange = (value) => {
    const nextCategory = value === "disk" ? diskCategories[0] : keyCategories[0];

    setForm({
      ...form,
      issueType: value,
      category: nextCategory,
    });
  };

  const handleAttachment = (file) => {
    if (!file) {
      setForm({ ...form, attachment: "" });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        attachment: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const submitTicket = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      if (!form.orderId || !form.productName || !form.description || !form.confirm) {
        setError("Please fill required fields and confirm accuracy.");
        return;
      }

      const data = await api("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          issueType: form.issueType,
          category: form.category,
          orderId: form.orderId,
          productName: form.productName,
          platform: form.platform,
          region: form.region,
          priority: form.priority,
          description: form.description,
          contactEmail: form.contactEmail,
          attachment: form.attachment,
        }),
      });

      setMessage(`✅ Ticket submitted: ${data.ticket.code}`);
      pushNotif("Report", `Ticket created: ${data.ticket.code}`);

      setForm({
        issueType: "key",
        category: "Invalid key",
        orderId: "",
        productName: "",
        platform: "PS5",
        region: "BD",
        priority: "Normal",
        description: "",
        contactEmail: "",
        attachment: "",
        confirm: false,
      });

      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to submit ticket");
    }
  };

  const deleteTicket = async (id) => {
    try {
      await api(`/api/tickets/${id}`, {
        method: "DELETE",
      });

      pushNotif("Report", "Ticket deleted.");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to delete ticket");
    }
  };

  const sendReply = async () => {
    try {
      if (!selectedTicket || !replyText.trim()) return;

      const data = await api(`/api/tickets/${selectedTicket._id}/reply`, {
        method: "POST",
        body: JSON.stringify({ text: replyText }),
      });

      setReplyText("");
      setSelectedTicket(data.ticket);
      pushNotif("Report", `Message sent on ${data.ticket.code}`);
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to send reply");
    }
  };

  const reopenTicket = async () => {
    try {
      if (!selectedTicket) return;

      const data = await api(`/api/tickets/${selectedTicket._id}/reopen`, {
        method: "PATCH",
      });

      setSelectedTicket(data.ticket);
      pushNotif("Report", `Re-open requested: ${data.ticket.code}`);
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to reopen ticket");
    }
  };

  const copyTicketCode = async () => {
    if (!selectedTicket) return;

    try {
      await navigator.clipboard.writeText(selectedTicket.code);
      pushNotif("Report", `Copied: ${selectedTicket.code}`);
    } catch {
      pushNotif("Report", `Ticket: ${selectedTicket.code}`);
    }
  };

  return (
    <section id="section-report" className="app-section report-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">🧾 Report & Issue Center</h1>
          <p className="page-sub">
            Submit key / disk problems privately. Tickets are saved in MongoDB.
          </p>
        </div>

        <div className="head-actions">
          <button className="ghost-btn" type="button" onClick={() => setHowOpen(true)}>
            How it works
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            + New Issue
          </button>
        </div>
      </header>

      {error && <div style={{ color: "#ff6b6b", marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ color: "#00e676", marginBottom: 16 }}>{message}</div>}

      <section className="ri-stats-row">
        <div className="ri-stat-card">
          <div className="ri-stat-label">Total Tickets</div>
          <div className="ri-stat-value">{stats.total}</div>
        </div>
        <div className="ri-stat-card">
          <div className="ri-stat-label">Pending</div>
          <div className="ri-stat-value pending">{stats.pending}</div>
        </div>
        <div className="ri-stat-card">
          <div className="ri-stat-label">Processing</div>
          <div className="ri-stat-value processing">{stats.processing}</div>
        </div>
        <div className="ri-stat-card">
          <div className="ri-stat-label">Completed</div>
          <div className="ri-stat-value completed">{stats.completed}</div>
        </div>
      </section>

      <section className="grid-2 ri-grid">
        <section className="card" ref={formRef}>
          <div className="ri-card-head">
            <div>
              <h2 className="ri-h2">🛠️ Submit a New Issue</h2>
              <span className="tiny muted">Takes around 30 seconds</span>
            </div>
            <span className="ri-pill">Private</span>
          </div>

          <form className="ri-form" onSubmit={submitTicket}>
            <div className="ri-row">
              <div className="field">
                <label>Issue Type</label>
                <select
                  value={form.issueType}
                  onChange={(e) => handleIssueTypeChange(e.target.value)}
                >
                  <option value="key">Digital Key</option>
                  <option value="disk">Physical Disk</option>
                </select>
              </div>

              <div className="field">
                <label>Problem Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ri-row">
              <div className="field">
                <label>Order / Invoice ID</label>
                <input
                  value={form.orderId}
                  onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                  placeholder="Example: GS-ORDER-23901"
                  required
                />
              </div>

              <div className="field">
                <label>Product Name</label>
                <input
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  placeholder="Example: EA FC 25"
                  required
                />
              </div>
            </div>

            <div className="ri-row ri-row-3">
              <div className="field">
                <label>Platform</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                >
                  <option value="PS5">PS5</option>
                  <option value="PS4">PS4</option>
                  <option value="PSN">PSN</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field">
                <label>Region</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                >
                  <option value="BD">Bangladesh</option>
                  <option value="US">USA</option>
                  <option value="UK">UK</option>
                  <option value="EU">EU</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Describe the Issue</label>
              <textarea
                maxLength="600"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What happened? Add error message, steps tried, screenshot info..."
                required
              />

              <div className="ri-small-row">
                <span className="hint">Tip: Provide exact error text + region + platform.</span>
                <span className="char">{form.description.length}/600</span>
              </div>
            </div>

            <div className="ri-row">
              <div className="field">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="user@email.com"
                />
              </div>

              <div className="field">
                <label>Attachment</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAttachment(e.target.files?.[0])}
                />

                <div className="ri-attach-preview">
                  {form.attachment && <img src={form.attachment} alt="attachment preview" />}
                </div>
              </div>
            </div>

            <div className="ri-row ri-end">
              <label className="ri-check">
                <input
                  type="checkbox"
                  checked={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.checked })}
                />
                <span>I confirm the information is accurate.</span>
              </label>

              <button className="primary-btn" type="submit">
                Submit Issue
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <div className="ri-card-head">
            <div>
              <h2 className="ri-h2">📌 My Tickets</h2>
              <span className="tiny muted">Stored in MongoDB</span>
            </div>
          </div>

          <div className="ri-controls">
            <div className="input-wrap">
              <span className="icon">🔎</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product, order, category..."
              />
            </div>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
            </select>

            <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="ri-tickets">
            {filteredTickets.length === 0 ? (
              <div className="empty">
                <b>No tickets found.</b>
                <div className="tiny muted">Create a new issue to see it here.</div>
              </div>
            ) : (
              filteredTickets.map((t) => (
                <div className="ri-ticket-card" key={t._id}>
                  <div className="ri-ticket-topline">
                    <div>
                      <h4 className="ri-ticket-title">
                        {t.code} • {t.productName}
                      </h4>
                      <div className="ri-ticket-sub">
                        {t.issueType} • {t.category} • {t.platform} • {t.region}
                      </div>
                      <div className="ri-ticket-sub">{formatTime(t.createdAt)}</div>
                    </div>

                    <div className="ri-ticket-badges">
                      <span className={`ri-status ${t.status}`}>{t.status}</span>
                      <span className="ri-priority">{t.priority}</span>
                    </div>
                  </div>

                  <div className="ri-ticket-sub" style={{ marginTop: 10 }}>
                    <b>Order:</b> {t.orderId} • <b>Contact:</b> {t.contactEmail || "—"}
                  </div>

                  <div className="ri-ticket-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => setSelectedTicket(t)}
                    >
                      Open
                    </button>

                    <button
                      className="danger-btn"
                      type="button"
                      onClick={() => deleteTicket(t._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
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
            notifications.map((n, i) => (
              <li key={i}>
                <b>{n.source}</b>
                <br />
                {n.text}
              </li>
            ))
          )}
        </ul>
      </aside>

      <div className={`modal-overlay ${howOpen ? "show" : ""}`} aria-hidden={!howOpen}>
        <div className="modal">
          <div className="modal-header">
            <h3>ℹ️ How it works</h3>
            <button className="modal-close" type="button" onClick={() => setHowOpen(false)}>
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="info-grid">
              <div className="info-card">
                <h4>1) Submit ticket</h4>
                <p>Add issue type, order ID, product, details, and screenshot.</p>
              </div>
              <div className="info-card">
                <h4>2) Staff updates</h4>
                <p>Status can be Pending, Processing, or Completed.</p>
              </div>
              <div className="info-card">
                <h4>3) Track updates</h4>
                <p>Open your ticket to see details and messages.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <div className="modal-overlay show" aria-hidden="false">
          <div className="modal">
            <div className="modal-header">
              <h3>Ticket {selectedTicket.code}</h3>
              <button className="modal-close" type="button" onClick={() => setSelectedTicket(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="ri-ticket-top">
                <div className="ri-ticket-meta">
                  <div className={`ri-status ${selectedTicket.status}`}>
                    {selectedTicket.status}
                  </div>
                  <div className="tiny muted">
                    {selectedTicket.productName} • {selectedTicket.orderId} •{" "}
                    {formatTime(selectedTicket.createdAt)}
                  </div>
                </div>

                <div className="ri-ticket-actions">
                  <button className="ghost-btn" type="button" onClick={copyTicketCode}>
                    Copy Code
                  </button>
                  <button className="ghost-btn" type="button" onClick={reopenTicket}>
                    Request Re-open
                  </button>
                </div>
              </div>

              <div className="ri-two-col">
                <section className="ri-mini-card">
                  <h4>🧾 Details</h4>
                  <div className="gs-row">
                    <span>Type</span>
                    <b>{selectedTicket.issueType}</b>
                  </div>
                  <div className="gs-row">
                    <span>Category</span>
                    <b>{selectedTicket.category}</b>
                  </div>
                  <div className="gs-row">
                    <span>Platform</span>
                    <b>{selectedTicket.platform}</b>
                  </div>
                  <div className="gs-row">
                    <span>Region</span>
                    <b>{selectedTicket.region}</b>
                  </div>
                  <div className="gs-row">
                    <span>Priority</span>
                    <b>{selectedTicket.priority}</b>
                  </div>
                  <div className="gs-row">
                    <span>Description</span>
                    <b>{selectedTicket.description}</b>
                  </div>
                </section>

                <section className="ri-mini-card">
                  <h4>🕒 Timeline</h4>
                  <div className="gs-row">
                    <span>Created</span>
                    <b>{formatTime(selectedTicket.createdAt)}</b>
                  </div>
                  <div className="gs-row">
                    <span>Updated</span>
                    <b>{formatTime(selectedTicket.updatedAt)}</b>
                  </div>
                </section>
              </div>

              <section className="ri-mini-card">
                <h4>💬 Messages</h4>

                <div className="chat-thread">
                  {selectedTicket.messages?.length ? (
                    selectedTicket.messages.map((m, i) => (
                      <div
                        key={i}
                        className={m.from === "customer" ? "user" : "bot"}
                        style={{ margin: "8px 0" }}
                      >
                        <b>{m.from === "customer" ? "You" : "Staff"}</b>: {m.text}
                        <div className="tiny muted">{formatTime(m.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="tiny muted">No messages yet.</div>
                  )}
                </div>

                <div className="ri-reply-row">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a message to staff..."
                  />
                  <button className="primary-btn" type="button" onClick={sendReply}>
                    Send
                  </button>
                </div>
              </section>

              <section className="ri-mini-card">
                <h4>📎 Attachments</h4>
                <div className="attach-list">
                  {selectedTicket.attachments?.length ? (
                    selectedTicket.attachments.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt="attachment"
                        style={{
                          width: 140,
                          height: 90,
                          objectFit: "cover",
                          borderRadius: 14,
                          margin: 6,
                        }}
                      />
                    ))
                  ) : (
                    <div className="tiny muted">No attachments.</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}