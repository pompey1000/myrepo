const BASE = "/api";

function getToken() {
  return localStorage.getItem("quicksplit_token");
}

export async function apiGet(path) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path, body, includeAuth = true) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (includeAuth && token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `DELETE ${path} failed: ${res.status}`);
  }
  return res.json();
}

// Auth-specific helpers

export async function register(email, username, password, accountType = "personal") {
  const data = await apiPost("/auth/register", { email, username, password, accountType }, false);
  localStorage.setItem("quicksplit_token", data.token);
  return data;
}

export async function login(email, password) {
  const data = await apiPost("/auth/login", { email, password }, false);
  localStorage.setItem("quicksplit_token", data.token);
  return data;
}

export async function getMe() {
  return apiGet("/auth/me");
}

export function clearToken() {
  localStorage.removeItem("quicksplit_token");
}

// ── Split payment helpers ──────────────────────────────────────────────────

export async function createSplitPayment(recipients, paymentMethodId) {
  return apiPost("/payments/split", { recipients, paymentMethodId });
}

export async function getSplitStatus(splitId) {
  return apiGet(`/payments/split/${splitId}/status`);
}

export async function listSplits() {
  return apiGet("/payments/split");
}

// ── Membership helpers ────────────────────────────────────────────────────

export async function getMembershipStatus() {
  return apiGet("/membership/status");
}

export async function upgradeToPremium() {
  return apiPost("/membership/upgrade", {});
}
