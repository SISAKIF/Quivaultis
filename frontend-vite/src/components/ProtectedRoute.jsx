import { Navigate } from "react-router-dom";
import { getSession } from "../utils/authStore";

export default function ProtectedRoute({ allowRoles, children }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles && !allowRoles.includes(session.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}