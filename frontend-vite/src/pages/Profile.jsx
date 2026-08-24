import { useEffect, useMemo, useState } from "react";
import { getToken } from "../utils/authStore";
import "../styles/profile.css";

const emptyProfile = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  dob: "",
  platform: "",
  playtime: "",
  genres: [],
  tag: "",
  bio: "",
};

const cloneProfile = (profile) => {
  return {
    fullName: profile?.fullName || "",
    username: profile?.username || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    country: profile?.country || "",
    city: profile?.city || "",
    dob: profile?.dob || "",
    platform: profile?.platform || "",
    playtime: profile?.playtime || "",
    genres: Array.isArray(profile?.genres) ? [...profile.genres] : [],
    tag: profile?.tag || "",
    bio: profile?.bio || "",
  };
};

function Profile() {
  const [formData, setFormData] = useState(emptyProfile);

  const [badgeStatus, setBadgeStatus] = useState("none");
  const [badgeName, setBadgeName] = useState("");
  const [lastUpdated, setLastUpdated] = useState("—");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestingBadge, setRequestingBadge] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaveMessage("");
  };

  const handleGenreChange = (e) => {
    const { value, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      genres: checked
        ? [...prev.genres, value]
        : prev.genres.filter((genre) => genre !== value),
    }));

    setSaveMessage("");
  };

  const handleReset = () => {
    if (originalProfile) {
      setFormData(cloneProfile(originalProfile));
      setSaveMessage("Profile reset to last saved version.");
    } else {
      setFormData(cloneProfile(emptyProfile));
      setSaveMessage("Profile reset.");
    }

    setRequestMessage("");
    setError("");
  };

  const completion = useMemo(() => {
    let done = 0;

    if (formData.fullName.trim()) done++;
    if (formData.username.trim()) done++;
    if (formData.email.trim()) done++;
    if (formData.phone.trim()) done++;
    if (formData.country.trim()) done++;
    if (formData.city.trim()) done++;
    if (formData.dob.trim()) done++;
    if (formData.platform.trim()) done++;
    if (formData.playtime.trim()) done++;
    if (formData.bio.trim().length >= 10) done++;
    if (formData.genres.length >= 1) done++;

    return Math.round((done / 11) * 100);
  }, [formData]);

  const currentRank = useMemo(() => {
    if (completion === 100) return "Elite";
    if (completion >= 80) return "Gold";
    if (completion >= 50) return "Silver";
    if (completion >= 20) return "Bronze";
    return "Starter";
  }, [completion]);

  const badgeStatusLabel = useMemo(() => {
    if (badgeStatus === "approved") return "Approved";
    if (badgeStatus === "pending") return "Pending";
    if (badgeStatus === "rejected") return "Rejected";
    return "None";
  }, [badgeStatus]);

  const handleExportExcel = () => {
    try {
      setError("");
      setRequestMessage("");
      setSaveMessage("");

      const rows = [
        ["Field", "Value"],
        ["Full Name", formData.fullName],
        ["Username", formData.username],
        ["Email", formData.email],
        ["Phone", formData.phone],
        ["Country", formData.country],
        ["City", formData.city],
        ["Date of Birth", formData.dob],
        ["Platform", formData.platform],
        ["Weekly Playtime", formData.playtime],
        ["Favorite Genres", formData.genres.join(", ")],
        ["Gamer Tag", formData.tag],
        ["Bio", formData.bio],
        ["Completion", `${completion}%`],
        ["Current Rank", currentRank],
        ["Badge Status", badgeStatusLabel],
        ["Badge Name", badgeName || ""],
        ["Last Updated", lastUpdated],
        ["Exported At", new Date().toLocaleString()],
      ];

      const csvContent = rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const safeName =
        formData.username.trim() ||
        formData.fullName.trim().replace(/\s+/g, "_") ||
        "profile";

      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}_profile.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setSaveMessage("Profile Excel file exported successfully.");
    } catch (err) {
      setError(err.message || "Failed to export Excel file");
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setError("");
        setSaveMessage("");
        setRequestMessage("");

        const token = getToken();

        if (!token) {
          throw new Error("No token found. Please login again.");
        }

        const res = await fetch("/api/profile/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load profile");
        }

        const loadedProfile = cloneProfile(data);

        setFormData(loadedProfile);
        setOriginalProfile(cloneProfile(loadedProfile));
        setBadgeStatus(data.badgeStatus || "none");
        setBadgeName(data.badgeName || "");
        setLastUpdated(
          data.lastProfileUpdate
            ? new Date(data.lastProfileUpdate).toLocaleString()
            : "—"
        );
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSaveMessage("");
      setRequestMessage("");
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("No token found. Please login again.");
      }

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          city: formData.city,
          dob: formData.dob,
          platform: formData.platform,
          playtime: formData.playtime,
          genres: formData.genres,
          tag: formData.tag,
          bio: formData.bio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save profile");
      }

      const savedProfile = cloneProfile(data.user);

      setFormData(savedProfile);
      setOriginalProfile(cloneProfile(savedProfile));
      setBadgeStatus(data.user.badgeStatus || "none");
      setBadgeName(data.user.badgeName || "");
      setLastUpdated(
        data.user.lastProfileUpdate
          ? new Date(data.user.lastProfileUpdate).toLocaleString()
          : "—"
      );
      setSaveMessage("Profile saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestBadge = async () => {
    try {
      setRequestingBadge(true);
      setRequestMessage("");
      setSaveMessage("");
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("No token found. Please login again.");
      }

      const res = await fetch("/api/badge-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to request badge");
      }

      setBadgeStatus("pending");
      setRequestMessage("Badge request submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to request badge");
    } finally {
      setRequestingBadge(false);
    }
  };

  if (loadingProfile) {
    return (
      <section id="section-profile" className="app-section profile-page">
        <div style={{ color: "white", padding: "20px" }}>
          Loading profile...
        </div>
      </section>
    );
  }

  return (
    <section id="section-profile" className="app-section profile-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">👤 Profile</h1>
          <p className="page-sub">
            Complete your profile to unlock badges. At <b>100%</b> you can
            request a verified badge.
          </p>
        </div>

        <div className="head-actions">
          <button
            className="ghost-btn"
            type="button"
            onClick={handleExportExcel}
          >
            Export Excel
          </button>

          <button className="ghost-btn" type="button" onClick={handleReset}>
            Reset
          </button>

          <button
            className="primary-btn"
            type="button"
            onClick={handleRequestBadge}
            disabled={
              requestingBadge ||
              completion < 100 ||
              badgeStatus === "pending" ||
              badgeStatus === "approved"
            }
          >
            {badgeStatus === "approved"
              ? "Badge Approved"
              : requestingBadge
              ? "Requesting..."
              : badgeStatus === "pending"
              ? "Request Pending"
              : "Request Badge"}
          </button>
        </div>
      </header>

      {error && (
        <div style={{ color: "#ff6b6b", marginBottom: "16px" }}>{error}</div>
      )}

      {requestMessage && (
        <div style={{ color: "#00e676", marginBottom: "16px" }}>
          {requestMessage}
        </div>
      )}

      <section className="pf-stats-row">
        <div className="pf-stat-card">
          <div className="pf-stat-label">Profile Completion</div>
          <div className="pf-stat-value">{completion}%</div>
        </div>

        <div className="pf-stat-card">
          <div className="pf-stat-label">Current Rank</div>
          <div className="pf-stat-value">{currentRank}</div>
        </div>

        <div className="pf-stat-card">
          <div className="pf-stat-label">Badge Status</div>
          <div className="pf-stat-value">{badgeStatusLabel}</div>
        </div>

        <div className="pf-stat-card">
          <div className="pf-stat-label">Last Updated</div>
          <div className="pf-stat-value">{lastUpdated}</div>
        </div>
      </section>

      <section className="grid-2 pf-grid">
        <section className="card" id="pfFormCard">
          <div className="pf-card-head">
            <div>
              <h2 className="pf-h2">🧩 Account &amp; Profile</h2>
              <span className="tiny muted">
                Fill the fields to reach 100% completion
              </span>
            </div>
            <span className="pf-pill">{completion}% Complete</span>
          </div>

          <form className="pf-form" onSubmit={handleSubmit}>
            <div className="pf-row">
              <div className="field">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Example: sakif_gamer"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pf-row">
              <div className="field">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Phone *</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+880..."
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pf-row">
              <div className="field">
                <label>Country *</label>
                <input
                  type="text"
                  name="country"
                  placeholder="Bangladesh"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Dhaka"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pf-row pf-row-3">
              <div className="field">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Platform *</label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="PS5">PS5</option>
                  <option value="PS4">PS4</option>
                  <option value="PC">PC</option>
                  <option value="Xbox">Xbox</option>
                  <option value="Switch">Switch</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>

              <div className="field">
                <label>Weekly Playtime *</label>
                <select
                  name="playtime"
                  value={formData.playtime}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="0-3">0–3 hrs</option>
                  <option value="4-8">4–8 hrs</option>
                  <option value="9-15">9–15 hrs</option>
                  <option value="16+">16+ hrs</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Favorite Genres *</label>
              <div className="pf-chips">
                <label className="pf-chip">
                  <input
                    type="checkbox"
                    value="Action"
                    checked={formData.genres.includes("Action")}
                    onChange={handleGenreChange}
                  />
                  Action
                </label>

                <label className="pf-chip">
                  <input
                    type="checkbox"
                    value="RPG"
                    checked={formData.genres.includes("RPG")}
                    onChange={handleGenreChange}
                  />
                  RPG
                </label>

                <label className="pf-chip">
                  <input
                    type="checkbox"
                    value="Strategy"
                    checked={formData.genres.includes("Strategy")}
                    onChange={handleGenreChange}
                  />
                  Strategy
                </label>

                <label className="pf-chip">
                  <input
                    type="checkbox"
                    value="Sports"
                    checked={formData.genres.includes("Sports")}
                    onChange={handleGenreChange}
                  />
                  Sports
                </label>

                <label className="pf-chip">
                  <input
                    type="checkbox"
                    value="Racing"
                    checked={formData.genres.includes("Racing")}
                    onChange={handleGenreChange}
                  />
                  Racing
                </label>

                <label className="pf-chip">
                  <input
                    type="checkbox"
                    value="Horror"
                    checked={formData.genres.includes("Horror")}
                    onChange={handleGenreChange}
                  />
                  Horror
                </label>
              </div>
              <div className="tiny muted">Pick at least 1</div>
            </div>

            <div className="pf-row">
              <div className="field">
                <label>Gamer Tag / PSN / Steam (optional)</label>
                <input
                  type="text"
                  name="tag"
                  placeholder="Example: SakifPSN_01"
                  value={formData.tag}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Avatar (optional)</label>
                <input type="file" accept="image/*" />
                <div className="pf-avatar-preview"></div>
              </div>
            </div>

            <div className="field">
              <label>About You *</label>
              <textarea
                name="bio"
                maxLength="250"
                placeholder="Short bio (required for 100%)"
                value={formData.bio}
                onChange={handleChange}
              ></textarea>
              <div className="pf-small-row">
                <span className="hint">Tip: keep it simple and real</span>
                <span className="char">{formData.bio.length}/250</span>
              </div>
            </div>

            <div className="pf-actions">
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>

              <button
                className="ghost-btn"
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>

            <div className="msg">
              {saveMessage && (
                <span style={{ color: "#00e676" }}>{saveMessage}</span>
              )}
            </div>
          </form>
        </section>

        <aside className="card" id="pfSideCard">
          <div className="pf-card-head">
            <div>
              <h2 className="pf-h2">📈 Progress</h2>
              <span className="tiny muted">Completion is calculated live</span>
            </div>
          </div>

          <div className="pf-progress">
            <div className="pf-progress-top">
              <b>{completion}%</b>
              <span className="tiny muted">
                {completion === 100
                  ? "Ready for verified badge"
                  : "Complete fields to increase"}
              </span>
            </div>
            <div className="pf-bar">
              <div
                className="pf-bar-fill"
                style={{ width: `${completion}%` }}
              ></div>
            </div>
          </div>

          <div className="pf-checklist">
            <div className="pf-check">
              <b>Selected Genres</b>
              <span>{formData.genres.length}</span>
            </div>

            <div className="pf-check">
              <b>Bio Length</b>
              <span>{formData.bio.length}/250</span>
            </div>
          </div>

          <div className="pf-badge-card">
            <div className="pf-badge-title">🏅 Badges</div>

            <div className="pf-badge-row">
              <span className={`pf-badge ${completion >= 20 ? "ok" : "warn"}`}>
                Bronze
              </span>

              <span className={`pf-badge ${completion >= 50 ? "ok" : "warn"}`}>
                Silver
              </span>

              <span className={`pf-badge ${completion >= 80 ? "ok" : "warn"}`}>
                Gold
              </span>

              <span
                className={`pf-badge ${
                  completion === 100 || badgeStatus === "approved"
                    ? "ok"
                    : "warn"
                }`}
              >
                Verified Eligible
              </span>
            </div>

            <div className="tiny muted" style={{ marginTop: "10px" }}>
              {badgeStatus === "approved"
                ? `Approved: ${badgeName || "Verified Badge"}`
                : badgeStatus === "pending"
                ? "Badge request is pending review."
                : badgeStatus === "rejected"
                ? "Your last badge request was rejected."
                : completion === 100
                ? "You can request verified badge now."
                : "Reach 100% to request verified badge."}
            </div>
          </div>

          <div className="pf-request-card">
            <div className="pf-badge-title">📨 Badge Request</div>

            <div className="tiny muted">
              {badgeStatus === "approved"
                ? `Badge approved: ${badgeName || "Verified Badge"}`
                : badgeStatus === "pending"
                ? "Request submitted and waiting for review."
                : badgeStatus === "rejected"
                ? "Request rejected. You may update profile and try again later."
                : "No request yet."}
            </div>
          </div>
        </aside>
      </section>
    </section>
  );
}

export default Profile;