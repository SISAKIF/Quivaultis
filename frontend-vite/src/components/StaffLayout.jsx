import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../utils/authStore";

export default function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();

  const goTo = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#020817", color: "white" }}>
      <aside
        style={{
          width: "250px",
          background: "#0f172a",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ margin: 0 }}>Staff Panel</h2>
            <p style={{ marginTop: 6, color: "#94a3b8", fontSize: "14px" }}>
              {session?.username || "Staff"}
            </p>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <button
              onClick={() => goTo("/staff")}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: isActive("/staff") ? "#06b6d4" : "#1e293b",
                color: isActive("/staff") ? "#001018" : "white",
                fontWeight: "bold",
                textAlign: "left",
              }}
            >
              📋 Badge Requests
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background: "#ff6b6b",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "#0f172a",
          }}
        >
          <h2 style={{ margin: 0 }}>Staff Dashboard</h2>
        </div>

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}