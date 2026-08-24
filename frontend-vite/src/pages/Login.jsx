import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getSession, normalizeEmail, saveSession } from "../utils/authStore";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  const DEMO = useMemo(
    () => ({
      admin: { email: "admin@gamevault.com", password: "admin123" },
      staff: { email: "staff@gamevault.com", password: "staff123" },
    }),
    []
  );

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "customer",
    rememberMe: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function goRoleHome(role) {
    const map = {
      admin: "/admin",
      staff: "/staff",
      customer: "/customer/dashboard",
    };
    navigate(map[role] || "/");
  }

  function fillDemo() {
    const d = DEMO[form.role];
    if (!d) return;
    setForm((p) => ({ ...p, email: d.email, password: d.password }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const email = normalizeEmail(form.email);
      const password = form.password || "";
      const role = form.role;
      const rememberMe = form.rememberMe;

      if (!email || !password) {
        throw new Error("All fields are required!");
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      saveSession({
        role: data.user.role,
        username: data.user.username,
        email: data.user.email,
        token: data.token,
        loginAt: Date.now(),
      });

      if (rememberMe) localStorage.setItem("gv_remember_email", email);
      else localStorage.removeItem("gv_remember_email");

      goRoleHome(data.user.role);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const s = getSession();
    if (s?.role) goRoleHome(s.role);
  }, []);

  useEffect(() => {
    const remembered = localStorage.getItem("gv_remember_email");
    if (remembered) {
      setForm((p) => ({ ...p, email: remembered, rememberMe: true }));
    }
  }, []);

  return (
    <div className="login-page">
      <Navbar />

      <main className="auth-wrap">
        <section className="auth-card">
          <div className="brand">
            <div className="brand-badge">🎮</div>
            <div className="brand-text">
              <h1>Quivaultis</h1>
              <p>Sign in to continue</p>
            </div>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@email.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <div className="pw-row">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowPass((s) => !s)}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="field">
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="customer">Customer</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <div className="row">
              <label className="check">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>

              <button type="button" className="link-btn" onClick={fillDemo}>
                Use demo
              </button>
            </div>

            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="muted">
              New user? <Link className="link" to="/register">Register here</Link>
            </p>

            <p className="error" aria-live="polite">{error}</p>
          </form>

          <div className="hint">
            <p><strong>Demo fill only:</strong></p>
            <ul>
              <li>Admin: admin@gamevault.com / admin123</li>
              <li>Staff: staff@gamevault.com / staff123</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}