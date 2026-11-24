const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(API_BASE_URL + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

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
    throw new Error(message);
  }

  return response.json();
}

export async function getHealth() {
  return request("/api/v1/health");
}

export async function getProfile() {
  return request("/api/v1/profile");
}

export async function saveProfile(profile) {
  return request("/api/v1/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}
