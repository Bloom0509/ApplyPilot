function getInitials(name) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function Header({ active, profile, account, onLogout }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Workspace</span>
        <span className="crumb-slash">/</span>
        <strong>{active}</strong>
      </div>
      <div className="topbar-actions">
        <span className="account-email">{account?.email}</span>
        <div className="top-avatar" aria-label={profile?.full_name || "Candidate profile"}>
          {getInitials(profile?.full_name)}
        </div>
        <button className="logout-button" onClick={onLogout}>Sign out</button>
      </div>
    </header>
  );
}
