const sampleJobs = [
  { company: "Northstar", mark: "N", color: "mint", title: "Senior AI Engineer", detail: "Remote · Full-time", match: 96, status: "Ready to review" },
  { company: "Linear Labs", mark: "L", color: "lavender", title: "Staff Software Engineer", detail: "New York, NY · Hybrid", match: 91, status: "Resume tailored" },
  { company: "Vercel", mark: "V", color: "peach", title: "Applied AI Engineer", detail: "Remote · Full-time", match: 88, status: "Application sent" },
];

function MatchCard({ job }) {
  return (
    <div className="job-row">
      <div className={`company-mark ${job.color}`}>{job.mark}</div>
      <div className="job-info">
        <strong>{job.title}</strong>
        <span>{job.company}<i>·</i>{job.detail}</span>
      </div>
      <div className="match-cell">
        <div className="match-score">{job.match}%</div>
        <span>match</span>
      </div>
      <div className="status-cell">
        <span className={`status-dot ${job.status === "Application sent" ? "sent" : ""}`} />
        {job.status}
      </div>
      <span className="row-more" aria-hidden="true">···</span>
    </div>
  );
}

function Stats() {
  return (
    <section className="stats-grid">
      <article className="stat-card">
        <div className="stat-top"><span>Strong matches</span><span className="stat-icon violet">✳</span></div>
        <div className="stat-value">12 <span className="trend">↗ 3 this week</span></div>
        <div className="stat-foot">Sample dashboard data</div>
      </article>
      <article className="stat-card">
        <div className="stat-top"><span>In progress</span><span className="stat-icon blue">↗</span></div>
        <div className="stat-value">8</div>
        <div className="stat-foot">Sample application count</div>
      </article>
      <article className="stat-card">
        <div className="stat-top"><span>Need your review</span><span className="stat-icon amber">✎</span></div>
        <div className="stat-value">3 <span className="review-pill">Ready when you are</span></div>
        <div className="stat-foot">Sample review count</div>
      </article>
    </section>
  );
}

function JobList({ onNavigate }) {
  return (
    <>
      <section className="section-heading">
        <div><h2>Example roles <span className="sparkle">✳</span></h2><p>Sample cards to preview the job list</p></div>
        <button className="text-button" onClick={() => onNavigate("Discover jobs")}>View all roles <span>→</span></button>
      </section>
      <section className="jobs-card">
        <div className="jobs-table-head"><span>ROLE</span><span>FIT</span><span>STATUS</span><span /></div>
        {sampleJobs.map((job) => <MatchCard key={job.title} job={job} />)}
        <button className="load-more" onClick={() => onNavigate("Discover jobs")}>Explore sample roles <span>→</span></button>
      </section>
    </>
  );
}

function NextStep({ profile, onNavigate }) {
  return (
    <section className="bottom-grid">
      <article className="focus-card">
        <div className="focus-icon">✳</div>
        <div>
          <span className="card-kicker">GET STARTED</span>
          <h3>{profile?.full_name ? "Your profile is saved" : "Create your career profile"}</h3>
          <p>Add experience and preferences to prepare for future job matching.</p>
        </div>
        <button className="arrow-button" aria-label="Open career profile" onClick={() => onNavigate("Career profile")}>→</button>
      </article>
      <article className="week-card">
        <div className="week-head"><span className="card-kicker">SAMPLE ACTIVITY</span><span className="week-dates">Preview only</span></div>
        <div className="week-number">4 <span>applications in motion</span></div>
        <div className="week-progress"><i /></div>
        <div className="week-foot"><span>Sample follow-up activity</span></div>
      </article>
    </section>
  );
}

export default function Overview({ profile, onNavigate }) {
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  return (
    <>
      <section className="welcome">
        <div>
          <div className="eyebrow"><span className="live-dot" /> WORKSPACE OVERVIEW</div>
          <h1>{firstName ? `Welcome, ${firstName}` : "Welcome to ApplyPilot"} <span className="wave">✳</span></h1>
          <p>Your job search workspace starts with a profile you control.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("Discover jobs")}><span>＋</span> Find new roles</button>
      </section>

      <div className="sample-notice">Dashboard preview · job matches and application counts below are sample data.</div>
      <Stats />
      <JobList onNavigate={onNavigate} />
      <NextStep profile={profile} onNavigate={onNavigate} />
      <footer className="privacy-note"><span>♧</span> Your profile stays under your control. Nothing is submitted from this preview.</footer>
    </>
  );
}
