import { useEffect, useRef, useState } from "react";
import AuthPage from "../components/AuthPage.jsx";
import CareerProfile from "../components/CareerProfile.jsx";
import Header from "../components/Header.jsx";
import JobsPage from "../components/JobsPage.jsx";
import Overview from "../components/Overview.jsx";
import PlaceholderPage from "../components/PlaceholderPage.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { getAccount, getProfile, hasAccessToken, login, register, saveProfile, setAccessToken } from "../services/api.js";

function App() {
  const [active, setActive] = useState("Overview");
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState("loading");
  const [profileError, setProfileError] = useState("");
  const [account, setAccount] = useState(null);
  const [authState, setAuthState] = useState(hasAccessToken() ? "loading" : "signed-out");
  const checkedSession = useRef(false);

  async function loadProfile() {
    setProfileState("loading");
    setProfileError("");

    try {
      const savedProfile = await getProfile();
      setProfile(savedProfile);
      setProfileState("saved");
    } catch (error) {
      if (error.message === "Profile not found") {
        setProfile(null);
        setProfileState("empty");
      } else {
        setProfileError(error.message);
        setProfileState("error");
      }
    }
  }

  useEffect(() => {
    if (authState !== "loading" || checkedSession.current) return;
    checkedSession.current = true;
    getAccount().then((currentAccount) => {
      setAccount(currentAccount);
      setAuthState("signed-in");
      loadProfile();
    }).catch(() => {
      setAccessToken(null);
      setAuthState("signed-out");
    });
  }, [authState]);

  useEffect(() => {
    function expireSession() {
      setAccount(null);
      setProfile(null);
      setAuthState("signed-out");
    }
    window.addEventListener("applypilot:auth-expired", expireSession);
    return () => window.removeEventListener("applypilot:auth-expired", expireSession);
  }, []);

  async function handleAuthenticate(mode, email, password) {
    const result = mode === "register" ? await register(email, password) : await login(email, password);
    setAccessToken(result.access_token);
    const currentAccount = await getAccount();
    setAccount(currentAccount);
    setAuthState("signed-in");
    await loadProfile();
  }

  function handleLogout() {
    setAccessToken(null);
    setAccount(null);
    setProfile(null);
    setAuthState("signed-out");
  }

  async function handleSaveProfile(payload) {
    const savedProfile = await saveProfile(payload);
    setProfile(savedProfile);
    setProfileState("saved");
  }

  function renderPage() {
    if (active === "Overview") {
      return <Overview profile={profile} onNavigate={setActive} />;
    }

    if (active === "Career profile") {
      const profileStatus = profileState === "error"
        ? { status: "error", message: profileError }
        : profileState;

      return (
        <CareerProfile
          profile={profile}
          profileState={profileStatus}
          onRetry={loadProfile}
          onSave={handleSaveProfile}
        />
      );
    }

    if (active === "Discover jobs") {
      return <JobsPage />;
    }

    return <PlaceholderPage page={active} onBack={() => setActive("Overview")} />;
  }

  if (authState === "loading") return <main className="auth-shell"><p role="status">Checking your session…</p></main>;
  if (authState === "signed-out") return <AuthPage onAuthenticate={handleAuthenticate} />;

  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={setActive} profile={profile} account={account} onLogout={handleLogout} />
      <main className="main-panel">
        <Header active={active} profile={profile} account={account} onLogout={handleLogout} />
        <div className="page-content">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;
