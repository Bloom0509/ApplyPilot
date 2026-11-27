import { useEffect, useState } from "react";
import { getSavedJobs, removeSavedJob } from "../services/api.js";

export default function SavedJobsPage({ onDiscover }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    getSavedJobs().then((result) => {
      if (current) setJobs(result.jobs);
    }).catch((requestError) => {
      if (current) setError(requestError.message || "Could not load saved jobs.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  async function handleRemove(jobId) {
    setRemovingId(jobId);
    setError("");
    try {
      await removeSavedJob(jobId);
      setJobs((current) => current.filter(({ job }) => job.id !== jobId));
    } catch (requestError) {
      setError(requestError.message || "Could not remove this saved job.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="jobs-page">
      <div className="eyebrow"><span className="live-dot" /> YOUR JOB SHORTLIST</div>
      <h1>Saved jobs</h1>
      <p className="profile-intro">Keep interesting listings here while you decide which ones to pursue.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <p role="status" className="jobs-empty-state">Loading saved jobs…</p> : jobs.length === 0 ? (
        <div className="jobs-empty-state"><p>You haven’t saved any jobs yet.</p><button className="primary-button" type="button" onClick={onDiscover}>Discover jobs</button></div>
      ) : (
        <div className="discovery-job-list">
          {jobs.map(({ job, saved_at: savedAt }) => (
            <article className="discovery-job-card" key={job.id}>
              <div className="discovery-job-topline"><span className="job-source-label">{job.source || "Job listing"}</span><time dateTime={savedAt}>Saved {new Date(savedAt).toLocaleDateString()}</time></div>
              <h2>{job.title}</h2>
              <div className="discovery-job-meta"><strong>{job.company}</strong><span>{job.location}</span>{job.remote && <span className="job-tag remote-tag">Remote</span>}</div>
              {job.match_score !== null && <p className="saved-job-match">Profile match: {job.match_score}%</p>}
              {job.description && <p className="discovery-job-description">{job.description}</p>}
              <div className="saved-job-actions">
                <a className="job-open-link" href={job.url} target="_blank" rel="noopener noreferrer">Open original listing <span aria-hidden="true">↗</span></a>
                <button className="save-job-button is-saved" type="button" onClick={() => handleRemove(job.id)} disabled={removingId === job.id}>{removingId === job.id ? "Removing…" : "Remove saved job"}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
