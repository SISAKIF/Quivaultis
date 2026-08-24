import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/authStore";

export default function DashboardChatbot() {
  const navigate = useNavigate();
  const token = getToken();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [stats, setStats] = useState({
    owned: 0,
    watched: 0,
    tickets: 0,
    profile: 0,
  });

  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "🔥 Hi! I can help with Store, Deals, Mood AI, Marketplace, Report, Profile, and your stats. Type: help",
    },
  ]);

  const loadStats = async () => {
    try {
      if (!token) return;

      const [ownedRes, watchedRes, ticketRes, profileRes] = await Promise.all([
        fetch("/api/store/owned", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/deals/watched", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/tickets/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const ownedData = await ownedRes.json();
      const watchedData = await watchedRes.json();
      const ticketData = await ticketRes.json();
      const profileData = await profileRes.json();

      setStats({
        owned: ownedData.count || 0,
        watched: Array.isArray(watchedData) ? watchedData.length : 0,
        tickets: ticketData.open || 0,
        profile: profileData.completionPercentage || 0,
      });
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    if (open) loadStats();
  }, [open]);

  const botReply = (text) => {
    setMessages((prev) => [...prev, { from: "bot", text }]);
  };

  const go = (path, reply) => {
    botReply(reply);
    setTimeout(() => navigate(path), 400);
  };

  const handleCommand = (value) => {
    const text = value.trim();
    if (!text) return;

    const cmd = text.toLowerCase();

    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");

    if (cmd.includes("help")) {
      botReply(
        "You can type: store, deals, mood ai, marketplace, report, profile, owned games, checkout, stats, or recommend."
      );
      return;
    }

    if (cmd.includes("store") || cmd.includes("game")) {
      go("/customer/store", "Opening Game Store.");
      return;
    }

    if (cmd.includes("deal") || cmd.includes("discount")) {
      go("/customer/deals", "Opening Deals page.");
      return;
    }

    if (cmd.includes("mood")) {
      go("/customer/mood-ai", "Opening Mood AI.");
      return;
    }

    if (cmd.includes("market")) {
      go("/customer/marketplace", "Opening Marketplace.");
      return;
    }

    if (cmd.includes("report") || cmd.includes("issue") || cmd.includes("ticket")) {
      go("/customer/report", "Opening Report & Issue Center.");
      return;
    }

    if (cmd.includes("profile")) {
      go("/customer/profile", "Opening Profile page.");
      return;
    }

    if (cmd.includes("owned") || cmd.includes("library")) {
      go("/customer/owned-games", "Opening Owned Games.");
      return;
    }

    if (cmd.includes("checkout") || cmd.includes("cart")) {
      go("/customer/store", "Checkout is inside the Store page.");
      return;
    }

    if (cmd.includes("stats") || cmd.includes("status")) {
      botReply(
        `Your stats: Owned Games ${stats.owned}, Watched Deals ${stats.watched}, Open Tickets ${stats.tickets}, Profile Completion ${stats.profile}%.`
      );
      return;
    }

    if (cmd.includes("suggest") || cmd.includes("recommend")) {
      botReply(
        "For personal suggestions use Mood AI. For cheap games use Deals. For player items use Marketplace."
      );
      return;
    }

    botReply("I did not understand. Type help.");
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} style={styles.floatBtn}>
          🤖
        </button>
      )}

      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <div>
              <h3 style={styles.title}>AI Hub</h3>
              <p style={styles.sub}>Dashboard Assistant</p>
            </div>

            <button onClick={() => setOpen(false)} style={styles.closeBtn}>
              ✕
            </button>
          </div>

          <div style={styles.chatArea}>
            {messages.map((m, index) => (
              <div
                key={index}
                style={m.from === "bot" ? styles.botMsg : styles.userMsg}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div style={styles.quickRow}>
            <button onClick={() => handleCommand("store")} style={styles.chip}>Store</button>
            <button onClick={() => handleCommand("deals")} style={styles.chip}>Deals</button>
            <button onClick={() => handleCommand("mood ai")} style={styles.chip}>Mood AI</button>
            <button onClick={() => handleCommand("stats")} style={styles.chip}>Stats</button>
          </div>

          <div style={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommand(input);
              }}
              placeholder="Ask about store, deals, report..."
              style={styles.input}
            />

            <button onClick={() => handleCommand(input)} style={styles.sendBtn}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  floatBtn: {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    border: "1px solid rgba(0,229,255,0.35)",
    background: "linear-gradient(135deg,#07111f,#111827)",
    color: "#00e5ff",
    fontSize: "26px",
    cursor: "pointer",
    zIndex: 9999,
    boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
  },

  panel: {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "380px",
    height: "600px",
    borderRadius: "20px",
    border: "1px solid rgba(0,229,255,0.28)",
    background: "linear-gradient(180deg,#10131f,#090b14)",
    color: "#e5e7eb",
    zIndex: 9999,
    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    margin: 0,
    fontSize: "18px",
  },

  sub: {
    margin: "3px 0 0",
    fontSize: "12px",
    color: "#9ca3af",
  },

  closeBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    marginTop: "16px",
    paddingRight: "4px",
  },

  botMsg: {
    background: "rgba(0,230,118,0.08)",
    border: "1px solid rgba(0,230,118,0.20)",
    padding: "12px",
    borderRadius: "16px",
    marginBottom: "10px",
    fontSize: "14px",
    lineHeight: 1.4,
  },

  userMsg: {
    background: "rgba(0,229,255,0.10)",
    border: "1px solid rgba(0,229,255,0.25)",
    padding: "12px",
    borderRadius: "16px",
    marginBottom: "10px",
    fontSize: "14px",
    lineHeight: 1.4,
    textAlign: "right",
  },

  quickRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },

  chip: {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: "12px",
  },

  inputRow: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
  },

  input: {
    flex: 1,
    padding: "13px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    outline: "none",
  },

  sendBtn: {
    width: "52px",
    borderRadius: "14px",
    border: "1px solid rgba(0,229,255,0.35)",
    background: "rgba(0,229,255,0.10)",
    color: "#00e5ff",
    cursor: "pointer",
    fontSize: "18px",
  },
};