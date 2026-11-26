import { useEffect, useState } from "react";
import { getJobs } from "../services/api.js";

function RecentJob({ job }) {
  return (
    <article className="overview-job-row">
      <div className="company-mark mint">{job.company?.trim()?.[0]?.toUpperCase() || "J"}</div>
      <div className="job-info">
        <strong>{job.title}</strong>
        <span>{job.company}<i>·</i>{job.location}{job.remote ? <><i>·</i>Remote</> : null}{job.match_score !== null ? <><i>·</i>{job.match_score}% profile match</> : null}</span>
      </div>
      <a className="overview-job-link" href={job.url} target="_blank" rel="noopener noreferrer">View listing ↗</a>
    </article>
  );
}

function NextStep({ profile, onNavigate }) {
  return (
    <section className="bottom-grid">
      <article className="focus-card">
        <div className="focus-icon">✳</div>
        <div>
          <span className="card-kicker">YOUR PROFILE</span>
          <h3>{profile?.full_name ? "Your profile is saved" : "Create your career profile"}</h3>
          <p>Add experience and preferences to inform future matching.</p>
        </div>
        <button className="arrow-button" aria-label="Open career profile" onClick={() => onNavigate("Career profile")}>→</button>
      </article>
      <article className="week-card job-source-card">
        <span className="card-kicker">CURRENT JOB SOURCE</span>
        <h3>Arbeitnow</h3>
        <p>Live listings with links to the original posting.</p>
        <button className="text-button" onClick={() => onNavigate("Discover jobs")}>Search jobs →</button>
      </article>
    </section>
  );
}

export default function Overview({ profile, onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [jobState, setJobState] = useState("loading");
  const [jobError, setJobError] = useState("");
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  useEffect(() => {
    let current = true;
    getJobs({ page: 1 }).then((result) => {
      if (!current) return;
      setJobs(result.jobs.slice(0, 4));
      setJobState("loaded");
    }).catch((error) => {
      if (!current) return;
      setJobError(error.message || "Could not load current job listings.");
      setJobState("error");
    });
    return () => { current = false; };
  }, []);

  return (
    <>
      <section className="welcome">
        <div>
          <div className="eyebrow"><span className="live-dot" /> WORKSPACE OVERVIEW</div>
          <h1>{firstName ? `Welcome, ${firstName}` : "Welcome to ApplyPilot"} <span className="wave">✳</span></h1>
          <p>Explore current roles and keep your candidate profile under your control.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("Discover jobs")}><span>＋</span> Find new roles</button>
      </section>

      <section className="section-heading overview-jobs-heading">
        <div><h2>Latest job listings</h2><p>Recent roles from Arbeitnow</p></div>
        <button className="text-button" onClick={() => onNavigate("Discover jobs")}>Search all jobs <span>→</span></button>
      </section>
      <section className="jobs-card overview-jobs-card" aria-live="polite">
        {jobState === "loading" && <p className="overview-jobs-message" role="status">Loading live listings…</p>}
        {jobState === "error" && <p className="overview-jobs-message form-error" role="alert">{jobError}</p>}
        {jobState === "loaded" && jobs.length === 0 && <p className="overview-jobs-message">No current listings were returned by the source.</p>}
        {jobs.map((job) => <RecentJob key={job.id} job={job} />)}
        <button className="load-more" onClick={() => onNavigate("Discover jobs")}>Browse and filter live listings <span>→</span></button>
      </section>
      <p className="jobs-attribution overview-attribution">Job listing data provided by <a href="https://www.arbeitnow.com" target="_blank" rel="noopener noreferrer">Arbeitnow</a>.</p>
      <NextStep profile={profile} onNavigate={onNavigate} />
      <footer className="privacy-note">Your profile stays under your control. ApplyPilot links to original job listings.</footer>
    </>
  );
}
