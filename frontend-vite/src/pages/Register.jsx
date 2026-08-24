import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getSession, normalizeEmail } from "../utils/authStore";
import "../styles/register.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading] = useState(false);

  function setField(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const username = String(form.username || "").trim();
      const email = normalizeEmail(form.email);
      const password = form.password || "";
      const confirmPassword = form.confirmPassword || "";

      if (!username || !email || !password || !confirmPassword) {
        throw new Error("All fields are required!");
      }

      if (username.length < 3) {
        throw new Error("Username must be at least 3 characters!");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters!");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match!");
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const s = getSession();
    if (s?.role) navigate("/");
  }, [navigate]);

  return (
    <div className="register-page">
      <Navbar />

      <main className="auth-wrap">
        <section className="auth-card">
          <div className="brand">
            <div className="brand-badge">🧾</div>
            <div className="brand-text">
              <h1>Quivaultis</h1>
              <p>Create your customer account</p>
            </div>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                name="username"
                placeholder="e.g., sakif2310"
                autoComplete="username"
                required
                value={form.username}
                onChange={setField}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@email.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={setField}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <div className="pw-row">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={setField}
                />
                <button type="button" className="link-btn" onClick={() => setShowPass((s) => !s)}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="field">
              <span>Confirm password</span>
              <div className="pw-row">
                <input
                  type={showPass2 ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-type password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={setField}
                />
                <button type="button" className="link-btn" onClick={() => setShowPass2((s) => !s)}>
                  {showPass2 ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="field">
              <span>Role</span>
              <input type="text" value="Customer" disabled />
            </label>

            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Creating..." : "Register"}
            </button>

            <p className="muted">
              Already have an account? <Link className="link" to="/login">Login</Link>
            </p>

            <p className="error" aria-live="polite">{error}</p>
            {success ? <p className="success" aria-live="polite">{success}</p> : null}
          </form>
        </section>
      </main>
    </div>
  );
}