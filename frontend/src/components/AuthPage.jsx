import { useState } from "react";

export default function AuthPage({ onAuthenticate }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onAuthenticate(mode, email, password);
    } catch (authError) {
      setError(authError.message || "We could not sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand"><div className="brand-mark">A<span>✦</span></div><span>applypilot</span></div>
        <div className="eyebrow"><span className="live-dot" /> CANDIDATE WORKSPACE</div>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="profile-intro">Sign in to keep your career profile private and available to you.</p>
        <label className="profile-field">Email
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="profile-field">Password
          <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} required value={password} onChange={(event) => setPassword(event.target.value)} />
          {mode === "register" && <small>Use at least 10 characters.</small>}
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "New to ApplyPilot? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
