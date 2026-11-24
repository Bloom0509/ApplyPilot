import { useEffect, useState } from "react";
import CareerProfile from "../components/CareerProfile.jsx";
import Header from "../components/Header.jsx";
import Overview from "../components/Overview.jsx";
import PlaceholderPage from "../components/PlaceholderPage.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { getProfile, saveProfile } from "../services/api.js";

function App() {
  const [active, setActive] = useState("Overview");
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState("loading");
  const [profileError, setProfileError] = useState("");

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
    loadProfile();
  }, []);

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

    return <PlaceholderPage page={active} onBack={() => setActive("Overview")} />;
  }

  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={setActive} profile={profile} />
      <main className="main-panel">
        <Header active={active} profile={profile} />
        <div className="page-content">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;
