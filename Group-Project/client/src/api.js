async function req(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (b) => req("POST", "/api/auth/register", b),
  login: (b) => req("POST", "/api/auth/login", b),
  logout: () => req("POST", "/api/auth/logout"),
  me: () => req("GET", "/api/auth/me"),
  stats: () => req("GET", "/api/public/stats"),
  publicReports: (q = "") => req("GET", "/api/public/reports" + q),
  myReports: () => req("GET", "/api/reports/mine"),
  createReport: (b) => req("POST", "/api/reports", b),
  updateReport: (id, b) => req("PUT", `/api/reports/${id}`, b),
  deleteReport: (id) => req("DELETE", `/api/reports/${id}`),
  adminReports: (q = "") => req("GET", "/api/admin/reports" + q),
  setStatus: (id, b) => req("PATCH", `/api/admin/reports/${id}/status`, b)
};
