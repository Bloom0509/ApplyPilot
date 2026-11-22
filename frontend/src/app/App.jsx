import { useState } from "react";

const navigation = [
  { label: "Overview", icon: "◫" },
  { label: "Discover jobs", icon: "⌕" },
  { label: "Applications", icon: "▤", count: "8" },
  { label: "Career profile", icon: "♙" },
];

const jobs = [
  { company: "Northstar", mark: "N", color: "mint", title: "Senior AI Engineer", detail: "Remote · Full-time", match: 96, status: "Ready to review" },
  { company: "Linear Labs", mark: "L", color: "lavender", title: "Staff Software Engineer", detail: "New York, NY · Hybrid", match: 91, status: "Resume tailored" },
  { company: "Vercel", mark: "V", color: "peach", title: "Applied AI Engineer", detail: "Remote · Full-time", match: 88, status: "Application sent" },
];

function Brand() {
  return <div className="brand"><div className="brand-mark">A<span>✦</span></div><span>applypilot</span></div>;
}

function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <Brand />
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {navigation.map((item) => (
          <button className={"nav-item " + (active === item.label ? "active" : "")} key={item.label} onClick={() => onNavigate(item.label)}>
            <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            {item.count && <span className="nav-count">{item.count}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-spark">✳</span>
          <strong>Your next move, made easier.</strong>
          <p>Your profile is 80% complete. Add a few details to improve your matches.</p>
          <button onClick={() => onNavigate("Career profile")}>Complete profile <span>↗</span></button>
        </div>
        <button className="user-card">
          <div className="avatar">JD</div><span className="user-meta"><strong>Jordan Davis</strong><small>AI Engineer</small></span><span className="more">···</span>
        </button>
      </div>
    </aside>
  );
}

function Header({ active }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{active}</strong></div>
      <div className="topbar-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification" aria-label="Notifications">♧<i /></button><div className="top-avatar">JD</div></div>
    </header>
  );
}

function MatchCard({ job }) {
  return (
    <div className="job-row">
      <div className={"company-mark " + job.color}>{job.mark}</div>
      <div className="job-info"><strong>{job.title}</strong><span>{job.company}<i>·</i>{job.detail}</span></div>
      <div className="match-cell"><div className="match-score">{job.match}%</div><span>match</span></div>
      <div className="status-cell"><span className={"status-dot " + (job.status === "Application sent" ? "sent" : "")} />{job.status}</div>
      <button className="row-more" aria-label={"More options for " + job.title}>···</button>
    </div>
  );
}

function Overview() {
  return (
    <>
      <section className="welcome">
        <div><div className="eyebrow"><span className="live-dot" /> YOUR SEARCH IS MOVING</div><h1>Good morning, Jordan <span className="wave">✳</span></h1><p>Small steps today. A great next role is closer than you think.</p></div>
        <button className="primary-button"><span>＋</span> Find new roles</button>
      </section>
      <section className="stats-grid">
        <article className="stat-card"><div className="stat-top"><span>Strong matches</span><span className="stat-icon violet">✳</span></div><div className="stat-value">12 <span className="trend">↗ 3 this week</span></div><div className="stat-foot">Roles that fit what you’re looking for</div></article>
        <article className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon blue">↗</span></div><div className="stat-value">8</div><div className="stat-foot">Applications across 5 companies</div></article>
        <article className="stat-card"><div className="stat-top"><span>Need your review</span><span className="stat-icon amber">✎</span></div><div className="stat-value">3 <span className="review-pill">Ready when you are</span></div><div className="stat-foot">Prepared by ApplyPilot, waiting for you</div></article>
      </section>
      <section className="section-heading"><div><h2>Roles picked for you <span className="sparkle">✳</span></h2><p>Matched to your experience and preferences</p></div><button className="text-button">View all roles <span>→</span></button></section>
      <section className="jobs-card">
        <div className="jobs-table-head"><span>ROLE</span><span>FIT</span><span>STATUS</span><span /></div>
        {jobs.map((job) => <MatchCard key={job.title} job={job} />)}
        <button className="load-more">Explore all 12 strong matches <span>→</span></button>
      </section>
      <section className="bottom-grid">
        <article className="focus-card"><div className="focus-icon">✳</div><div><span className="card-kicker">YOUR NEXT STEP</span><h3>Review your Northstar application</h3><p>Your tailored resume and cover letter are ready for a final look.</p></div><button className="arrow-button" aria-label="Review application">→</button></article>
        <article className="week-card"><div className="week-head"><span className="card-kicker">THIS WEEK</span><span className="week-dates">Nov 16 – 22</span></div><div className="week-number">4 <span>applications in motion</span></div><div className="week-progress"><i /></div><div className="week-foot"><span>2 follow-ups coming up</span><button aria-label="View follow-ups">→</button></div></article>
      </section>
      <footer className="privacy-note"><span>♧</span> You’re in control. Nothing is submitted without your approval.</footer>
    </>
  );
}

function App() {
  const [active, setActive] = useState("Overview");
  return (
    <div className="app-shell"><Sidebar active={active} onNavigate={setActive} /><main className="main-panel"><Header active={active} /><div className="page-content">
      {active === "Overview" ? <Overview /> : <section className="placeholder-view"><div className="eyebrow"><span className="live-dot" /> APPLYpilot WORKSPACE</div><h1>{active}</h1><p>This workspace is ready for the {active.toLowerCase()} workflow.</p><button className="primary-button" onClick={() => setActive("Overview")}>← Back to overview</button></section>}
    </div></main></div>
  );
}

export default App;
