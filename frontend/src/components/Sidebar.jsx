const navigation = [
  { label: "Overview", icon: "◫" },
  { label: "Discover jobs", icon: "⌕" },
  { label: "Saved jobs", icon: "♡" },
  { label: "Applications", icon: "▤" },
  { label: "Career profile", icon: "♙" },
];

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">A<span>✦</span></div>
      <span>applypilot</span>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function Sidebar({ active, onNavigate, profile }) {
  const displayName = profile?.full_name || "Your profile";
  const initials = getInitials(profile?.full_name);

  return (
    <aside className="sidebar">
      <Brand />
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {navigation.map((item) => (
          <button
            className={`nav-item ${active === item.label ? "active" : ""}`}
            key={item.label}
            onClick={() => onNavigate(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-spark">✳</span>
          <strong>{profile?.full_name ? "Keep your profile up to date." : "Start with your career profile."}</strong>
          <p>Your profile helps personalize job matches and saved listings.</p>
          <button onClick={() => onNavigate("Career profile")}>
            {profile?.full_name ? "Edit profile" : "Create profile"} <span>↗</span>
          </button>
        </div>
        <div className="user-card">
          <div className="avatar">{initials}</div>
          <span className="user-meta">
            <strong>{displayName}</strong>
            <small>{profile?.target_roles?.[0] || "Candidate"}</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
