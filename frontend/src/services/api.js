const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "applypilot_access_token";
let accessToken = sessionStorage.getItem(TOKEN_KEY);

export function setAccessToken(token) {
  accessToken = token;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(accessToken);
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(API_BASE_URL + path, { ...options, headers });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (Array.isArray(body.detail)) {
        message = body.detail.map((issue) => `${issue.loc.at(-1)}: ${issue.msg}`).join("; ");
      } else if (typeof body.detail === "string") {
        message = body.detail;
      }
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    if (response.status === 401 && path !== "/api/v1/auth/login") {
      setAccessToken(null);
      window.dispatchEvent(new Event("applypilot:auth-expired"));
    }
    throw new Error(message);
  }

  return response.json();
}

export async function getHealth() {
  return request("/api/v1/health");
}

export async function register(email, password) {
  return request("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function login(email, password) {
  return request("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function getAccount() {
  return request("/api/v1/auth/me");
}

export async function getProfile() {
  return request("/api/v1/profile");
}

export async function saveProfile(profile) {
  return request("/api/v1/profile", { method: "PUT", body: JSON.stringify(profile) });
}

export async function parseResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/api/v1/profile/resume/parse", { method: "POST", body: formData });
}

export async function getJobs(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return request(`/api/v1/jobs${query ? `?${query}` : ""}`);
}
