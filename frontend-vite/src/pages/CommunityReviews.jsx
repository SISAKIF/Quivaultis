import { useEffect, useMemo, useState } from "react";
import { getSession, getToken } from "../utils/authStore";
import "../styles/communityReviews.css";

const LS_NOTIFICATIONS = "dashboardNotifications";

const emptyForm = {
  gameId: "",
  rating: 0,
  text: "",
};

function safeJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function prettyDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function makeStars(rating) {
  const full = "★".repeat(Number(rating || 0));
  const empty = "☆".repeat(5 - Number(rating || 0));
  return `${full}${empty}`;
}

function calcScore(review) {
  const helpful = review.helpful?.length || 0;
  const reactions = review.reactions || {};
  const reactionCount =
    (reactions.fire?.length || 0) +
    (reactions.angry?.length || 0) +
    (reactions.sad?.length || 0) +
    (reactions.mind?.length || 0);

  return review.rating * 10 + helpful * 3 + reactionCount * 2;
}

function getTopReview(list) {
  if (list.length === 0) return null;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekReviews = list.filter(
    (review) => new Date(review.createdAt).getTime() >= oneWeekAgo
  );

  const base = weekReviews.length ? weekReviews : list;

  return base.slice().sort((a, b) => calcScore(b) - calcScore(a))[0];
}

export default function CommunityReviews() {
  const session = getSession();
  const token = getToken();

  const currentUser = {
    id: session?.id || session?.user?.id || session?.email || "guest_user",
    name:
      session?.username ||
      session?.user?.username ||
      session?.email ||
      "Gamer",
  };

  const [ownedGames, setOwnedGames] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGame, setFilterGame] = useState("all");
  const [sortMode, setSortMode] = useState("top");
  const [notifications, setNotifications] = useState([]);
  const [showHow, setShowHow] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      from: "bot",
      text: "👋 Try: tips, help, my reviews, top review, or stats.",
    },
  ]);

  const persistNotification = (text) => {
    const saved = safeJSON(LS_NOTIFICATIONS, []);
    const updated = [{ text, ts: Date.now() }, ...saved].slice(0, 40);
    saveJSON(LS_NOTIFICATIONS, updated);
    setNotifications(updated.slice(0, 12).map((item) => item.text));
  };

  const addNotification = (text) => {
    setNotifications((prev) => [text, ...prev].slice(0, 12));
  };

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      setError("");

      const res = await fetch("/api/community-reviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load reviews");
      }

      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadOwnedGames = async () => {
    try {
      if (!token) return;

      const res = await fetch("/api/store/owned", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data.ownedGames)) {
        setOwnedGames(data.ownedGames);

        if (data.ownedGames.length > 0) {
          setForm((prev) => ({
            ...prev,
            gameId: prev.gameId || data.ownedGames[0]._id,
          }));
        }
      }
    } catch {
      setOwnedGames([]);
    }
  };

  useEffect(() => {
    const savedNotifications = safeJSON(LS_NOTIFICATIONS, []);
    setNotifications(savedNotifications.slice(0, 12).map((item) => item.text));

    loadOwnedGames();
    loadReviews();
  }, [token]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total === 0
        ? "—"
        : (
            reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            total
          ).toFixed(1);

    const myReviews = reviews.filter(
      (review) => String(review.userId) === String(currentUser.id)
    );

    const helpfulReceived = myReviews.reduce(
      (sum, review) => sum + (review.helpful?.length || 0),
      0
    );

    return {
      total,
      avg,
      myReviews: myReviews.length,
      helpfulReceived,
    };
  }, [reviews, currentUser.id]);

  const topReview = useMemo(() => getTopReview(reviews), [reviews]);

  const filteredReviews = useMemo(() => {
    let list = reviews.slice();

    if (filterGame !== "all") {
      list = list.filter((review) => String(review.gameId) === String(filterGame));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();

      list = list.filter(
        (review) =>
          String(review.text || "").toLowerCase().includes(q) ||
          String(review.gameName || "").toLowerCase().includes(q) ||
          String(review.userName || "").toLowerCase().includes(q)
      );
    }

    if (sortMode === "new") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortMode === "high") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortMode === "low") {
      list.sort((a, b) => a.rating - b.rating);
    } else {
      list.sort((a, b) => calcScore(b) - calcScore(a));
    }

    return list;
  }, [reviews, filterGame, search, sortMode]);

  const selectedGame = ownedGames.find(
    (game) => String(game._id) === String(form.gameId)
  );

  const clearForm = () => {
    setForm({
      gameId: ownedGames[0]?._id || "",
      rating: 0,
      text: "",
    });
  };

  const submitReview = async () => {
    try {
      setMessage("");
      setError("");

      if (!selectedGame) {
        setMessage("❌ Please select a valid owned game.");
        return;
      }

      if (form.rating < 1 || form.rating > 5) {
        setMessage("❌ Please select a star rating.");
        return;
      }

      if (form.text.trim().length < 10) {
        setMessage("❌ Please write at least 10 characters.");
        return;
      }

      const url = editingId
        ? `/api/community-reviews/${editingId}`
        : "/api/community-reviews";

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify({
          gameId: form.gameId,
          rating: form.rating,
          text: form.text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save review");
      }

      await loadReviews();

      const note = editingId
        ? `✏️ You updated a review for ${selectedGame.title}`
        : `✅ You posted a review: ${selectedGame.title} (${form.rating}★)`;

      persistNotification(note);

      setEditingId(null);
      clearForm();
      setMessage(editingId ? "✅ Review updated successfully." : "✅ Review posted successfully.");
    } catch (err) {
      setError(err.message || "Failed to save review");
    }
  };

  const startEdit = (review) => {
    if (String(review.userId) !== String(currentUser.id)) {
      setMessage("❌ You can only edit your own review.");
      return;
    }

    setEditingId(review.id);
    setForm({
      gameId: review.gameId,
      rating: review.rating,
      text: review.text,
    });

    setMessage("Editing your review. Make changes and click Save Changes.");

    const card = document.getElementById("communityComposeCard");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    clearForm();
    setMessage("Edit cancelled.");
  };

  const deleteReview = async (review) => {
    try {
      if (String(review.userId) !== String(currentUser.id)) {
        setMessage("❌ You can only delete your own review.");
        return;
      }

      const ok = window.confirm("Delete this review permanently?");
      if (!ok) return;

      const res = await fetch(`/api/community-reviews/${review.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete review");
      }

      if (editingId === review.id) {
        setEditingId(null);
        clearForm();
      }

      const note = `🗑️ You deleted a review: ${review.gameName}`;
      persistNotification(note);

      setMessage("Review deleted.");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Failed to delete review");
    }
  };

  const toggleHelpful = async (reviewId) => {
    try {
      const res = await fetch(`/api/community-reviews/${reviewId}/helpful`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update helpful");
      }

      addNotification(data.message || "Helpful updated");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Failed to update helpful");
    }
  };

  const toggleReaction = async (reviewId, type) => {
    try {
      const res = await fetch(`/api/community-reviews/${reviewId}/reaction`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ type }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update reaction");
      }

      await loadReviews();
    } catch (err) {
      setError(err.message || "Failed to update reaction");
    }
  };

  const sendMessage = () => {
    const raw = chatInput.trim();
    const msg = raw.toLowerCase();

    if (!msg) return;

    setChatMessages((prev) => [...prev, { from: "user", text: raw }]);
    setChatInput("");

    if (msg === "clear" || msg === "/clear") {
      setChatMessages([
        {
          from: "bot",
          text: "👋 Try: tips, help, my reviews, top review, or stats.",
        },
      ]);
      return;
    }

    if (msg === "help") {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Commands: tips, my reviews, top review, stats, clear.",
        },
      ]);
      return;
    }

    if (msg === "tips") {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Great review tips: mention gameplay, story, performance, bugs, value, and whether you recommend it.",
        },
      ]);
      return;
    }

    if (msg === "my reviews") {
      const mine = reviews.filter(
        (review) => String(review.userId) === String(currentUser.id)
      );

      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text:
            mine.length === 0
              ? "You have not posted any reviews yet."
              : `You have ${mine.length} review(s). Latest: ${mine
                  .slice(0, 3)
                  .map((review) => `${review.gameName} (${review.rating}★)`)
                  .join(", ")}`,
        },
      ]);
      return;
    }

    if (msg === "top review") {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: topReview
            ? `Top review: ${topReview.gameName} by ${topReview.userName}.`
            : "No top review yet.",
        },
      ]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (msg === "stats") {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: `Your reviews: ${stats.myReviews}. Helpful received: ${stats.helpfulReceived}.`,
        },
      ]);
      return;
    }

    setChatMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: "I did not understand. Type help to see commands.",
      },
    ]);
  };

  return (
    <section id="section-community" className="community-page">
      <header className="community-page-head">
        <div>
          <h1 className="community-page-title">⭐ Community Reviews</h1>
          <p className="community-page-sub">
            Review games you own, react, and mark helpful reviews. Reviews are now saved in MongoDB.
          </p>
        </div>

        <div className="community-head-actions">
          <button className="community-ghost-btn" onClick={() => setShowHow(true)}>
            How it works
          </button>
          <button
            className="community-primary-btn"
            onClick={() => {
              const card = document.getElementById("communityComposeCard");
              if (card) card.scrollIntoView({ behavior: "smooth" });
            }}
          >
            ✍️ Write Review
          </button>
        </div>
      </header>

      {error && <div className="community-msg">❌ {error}</div>}

      <section className="community-stats-row">
        <div className="community-stat-card">
          <div className="community-stat-label">Total Reviews</div>
          <div className="community-stat-value">{stats.total}</div>
        </div>

        <div className="community-stat-card">
          <div className="community-stat-label">Avg Rating</div>
          <div className="community-stat-value">{stats.avg}</div>
        </div>

        <div className="community-stat-card">
          <div className="community-stat-label">Your Reviews</div>
          <div className="community-stat-value">{stats.myReviews}</div>
        </div>

        <div className="community-stat-card">
          <div className="community-stat-label">Helpful Received</div>
          <div className="community-stat-value">{stats.helpfulReceived}</div>
        </div>
      </section>

      <section className="community-card community-top-card">
        <div className="community-top-badge">
          <span className="community-pill">🏆 Top Review of the Week</span>
          <span className="community-small">
            {topReview ? topReview.gameName : "No reviews yet"}
          </span>
        </div>

        {topReview ? (
          <>
            <h3 className="community-top-title">
              {topReview.userName} •{" "}
              <span className="community-stars">{makeStars(topReview.rating)}</span>
            </h3>
            <div className="community-top-meta">
              <span>👍 Helpful: {topReview.helpful?.length || 0}</span>
              <span>⭐ Score: {calcScore(topReview)}</span>
              <span>{prettyDate(topReview.createdAt)}</span>
            </div>
            <p className="community-top-text">{topReview.text}</p>
          </>
        ) : (
          <div className="community-empty">Be the first to post a review.</div>
        )}
      </section>

      <section className="community-card community-compose" id="communityComposeCard">
        <div className="community-card-head">
          <h2>{editingId ? "✏️ Edit Your Review" : "✍️ Write a Review"}</h2>
          <span className="community-tiny">
            Only purchased games appear here
          </span>
        </div>

        {ownedGames.length === 0 ? (
          <div className="community-empty">
            You do not own any games yet. Buy a game from Store first, then you can review it.
          </div>
        ) : (
          <div className="community-grid">
            <div className="community-field">
              <label>Game</label>
              <select
                value={form.gameId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gameId: e.target.value }))
                }
              >
                {ownedGames.map((game) => (
                  <option key={game._id} value={game._id}>
                    {game.title}
                  </option>
                ))}
              </select>
              <div className="community-tiny community-muted">✅ Verified purchase</div>
            </div>

            <div className="community-field">
              <label>Rating</label>
              <div className="community-star-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={star <= form.rating ? "on" : ""}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, rating: star }))
                    }
                  >
                    ★
                  </button>
                ))}
                <span className="community-star-hint">
                  {form.rating ? `${form.rating}/5 selected` : "Select stars"}
                </span>
              </div>
            </div>

            <div className="community-field community-full">
              <label>Your Review</label>
              <textarea
                maxLength="400"
                placeholder="Be honest. What did you like or dislike?"
                value={form.text}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, text: e.target.value }))
                }
              />

              <div className="community-compose-footer">
                <span className="community-char">{form.text.length}/400</span>
                <div className="community-btn-row">
                  <button className="community-primary-btn" onClick={submitReview}>
                    {editingId ? "Save Changes" : "Post Review"}
                  </button>

                  {editingId && (
                    <button className="community-ghost-btn" onClick={cancelEdit}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              {message && <div className="community-msg">{message}</div>}
            </div>
          </div>
        )}
      </section>

      <section className="community-card community-feed-head">
        <div>
          <h2>🗣️ Community Feed</h2>
          <span className="community-tiny">
            Search, filter by game, and sort reviews
          </span>
        </div>

        <div className="community-controls">
          <div className="community-input-wrap">
            <span>🔎</span>
            <input
              type="text"
              placeholder="Search by game, user, or review..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
          >
            <option value="all">All Games</option>
            {ownedGames.map((game) => (
              <option key={game._id} value={game._id}>
                {game.title}
              </option>
            ))}
          </select>

          <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="top">Top</option>
            <option value="new">Newest</option>
            <option value="high">Highest Rating</option>
            <option value="low">Lowest Rating</option>
          </select>
        </div>
      </section>

      <section className="community-main-layout">
        <div className="community-reviews">
          {loadingReviews ? (
            <div className="community-empty">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="community-empty">No matching reviews found.</div>
          ) : (
            filteredReviews.map((review) => {
              const helpfulOn = review.helpful?.some(
                (id) => String(id) === String(currentUser.id)
              );
              const reactions = review.reactions || {};
              const isOwner = String(review.userId) === String(currentUser.id);

              return (
                <article className="community-review-card" key={review.id}>
                  <div className="community-review-top">
                    <div className="community-review-user">
                      <div className="community-avatar">
                        {(review.userName || "G").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="community-name">{review.userName}</p>
                        <div className="community-meta">
                          {review.gameName} • {prettyDate(review.createdAt)}
                          {review.editedAt
                            ? ` • Edited ${prettyDate(review.editedAt)}`
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div className="community-stars">{makeStars(review.rating)}</div>
                  </div>

                  <div className="community-review-text">{review.text}</div>

                  <div className="community-review-actions">
                    <button
                      className={`community-chip ${helpfulOn ? "on" : ""}`}
                      onClick={() => toggleHelpful(review.id)}
                    >
                      👍 Helpful {review.helpful?.length || 0}
                    </button>

                    <button
                      className={`community-chip ${
                        reactions.fire?.some((id) => String(id) === String(currentUser.id))
                          ? "on"
                          : ""
                      }`}
                      onClick={() => toggleReaction(review.id, "fire")}
                    >
                      🔥 {reactions.fire?.length || 0}
                    </button>

                    <button
                      className={`community-chip ${
                        reactions.angry?.some((id) => String(id) === String(currentUser.id))
                          ? "on"
                          : ""
                      }`}
                      onClick={() => toggleReaction(review.id, "angry")}
                    >
                      😡 {reactions.angry?.length || 0}
                    </button>

                    <button
                      className={`community-chip ${
                        reactions.sad?.some((id) => String(id) === String(currentUser.id))
                          ? "on"
                          : ""
                      }`}
                      onClick={() => toggleReaction(review.id, "sad")}
                    >
                      😢 {reactions.sad?.length || 0}
                    </button>

                    <button
                      className={`community-chip ${
                        reactions.mind?.some((id) => String(id) === String(currentUser.id))
                          ? "on"
                          : ""
                      }`}
                      onClick={() => toggleReaction(review.id, "mind")}
                    >
                      🤯 {reactions.mind?.length || 0}
                    </button>
                  </div>

                  {isOwner && (
                    <div className="community-owner-actions">
                      <button
                        className="community-owner-btn"
                        onClick={() => startEdit(review)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="community-owner-btn danger"
                        onClick={() => deleteReview(review)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        <aside className="community-side-panels">
          <div className="community-panel">
            <div className="community-panel-header">
              <h4>🔔 Notifications</h4>
              <span className="community-panel-badge">
                {notifications.length}
              </span>
            </div>

            <ul className="community-panel-list">
              {notifications.length === 0 ? (
                <li>No notifications yet.</li>
              ) : (
                notifications.map((note, index) => <li key={index}>{note}</li>)
              )}
            </ul>
          </div>

          <div className="community-panel">
            <div className="community-panel-header">
              <h4>🤖 Review Assistant</h4>
              <button
                className="community-panel-action"
                onClick={() =>
                  setChatMessages([
                    {
                      from: "bot",
                      text: "👋 Try: tips, help, my reviews, top review, or stats.",
                    },
                  ])
                }
              >
                Clear
              </button>
            </div>

            <div className="community-chat-area">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={msg.from === "user" ? "community-user" : "community-bot"}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="community-chat-input-row">
              <input
                type="text"
                placeholder="Ask something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </aside>
      </section>

      {showHow && (
        <div className="community-modal-overlay">
          <div className="community-modal">
            <div className="community-modal-header">
              <h3>ℹ️ How Community Reviews work</h3>
              <button onClick={() => setShowHow(false)}>✕</button>
            </div>

            <div className="community-modal-body">
              <div className="community-info-grid">
                <div className="community-info-card">
                  <h4>1) Verified reviews</h4>
                  <p>Only purchased games can be reviewed.</p>
                </div>

                <div className="community-info-card">
                  <h4>2) MongoDB storage</h4>
                  <p>Reviews are saved permanently in your database.</p>
                </div>

                <div className="community-info-card">
                  <h4>3) Top Review</h4>
                  <p>The highest scoring review becomes the top review.</p>
                </div>
              </div>

              <div className="community-note">
                This version is connected with backend API and MongoDB.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}