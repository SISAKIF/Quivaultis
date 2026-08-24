export function normalizeEmail(v) {
  return String(v || "").trim().toLowerCase();
}

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("gv_users") || "[]");
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem("gv_users", JSON.stringify(users));
}

export function emailExists(email) {
  const users = getUsers();
  return users.some((u) => normalizeEmail(u.email) === normalizeEmail(email));
}

export function findCustomer(email) {
  const users = getUsers();
  return users.find((u) => normalizeEmail(u.email) === normalizeEmail(email));
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem("gv_session") || "null");
  } catch {
    return null;
  }
}

export function getToken() {
  const session = getSession();
  return session?.token || "";
}

export function saveSession(session) {
  localStorage.setItem("gv_session", JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem("gv_session");
}