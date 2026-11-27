import { useEffect, useMemo, useState } from "react";
import { getJobs, getSavedJobs, removeSavedJob, saveJob } from "../services/api.js";

function JobCard({ job, isSaved, isSaving, onToggleSave }) {
  const posted = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : null;
  const labels = [...job.job_types, ...job.tags].slice(0, 5);

  return (
    <article className="discovery-job-card">
      <div className="discovery-job-topline">
        <span className="job-source-label">Arbeitnow listing</span>
        {posted && <time dateTime={job.posted_at}>Posted {posted}</time>}
      </div>
      <h2>{job.title}</h2>
      <button className={`save-job-button ${isSaved ? "is-saved" : ""}`} type="button" onClick={() => onToggleSave(job)} disabled={isSaving} aria-pressed={isSaved}>
        {isSaving ? "Saving…" : isSaved ? "Saved · Remove" : "Save job"}
      </button>
      <div className="discovery-job-meta"><strong>{job.company}</strong><span>{job.location}</span>{job.remote && <span className="job-tag remote-tag">Remote</span>}</div>
      {labels.length > 0 && <div className="job-tags">{labels.map((label) => <span className="job-tag" key={label}>{label}</span>)}</div>}
      <div className="match-explanation">
        {job.match_score === null ? <p className="match-not-ready">Add skills, target roles, or preferences to your career profile to see a personalized match score.</p> : <>
          <strong className="match-score-badge">Profile match: {job.match_score}%</strong>
          <p className="match-score-note">Weighted using the profile details you have saved.</p>
          <ul>{job.match_reasons.map((reason) => <li className={reason.matched ? "match-positive" : "match-neutral"} key={reason.signal}>
            <span>{reason.label} · {reason.points} pts</span>
            <small>{reason.detail}</small>
          </li>)}</ul>
        </>}
      </div>
      {job.description && <p className="discovery-job-description">{job.description}</p>}
      <a className="job-open-link" href={job.url} target="_blank" rel="noopener noreferrer">View job on Arbeitnow <span aria-hidden="true">↗</span></a>
    </article>
  );
}

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobs, setJobs] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [savingIds, setSavingIds] = useState(() => new Set());

  useEffect(() => {
    getSavedJobs().then((result) => setSavedIds(new Set(result.jobs.map(({ job }) => job.id)))).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filters = useMemo(() => ({
    q: debouncedQuery,
    location: location.trim(),
    remote: remote === "remote" ? true : remote === "onsite" ? false : undefined,
    job_type: jobType.trim(),
  }), [debouncedQuery, location, remote, jobType]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    setJobs([]);
    setNextPage(null);
    setVisibleCount(24);
    getJobs({ ...filters, page: 1 }).then((result) => {
      if (!current) return;
      setJobs(result.jobs);
      setTotal(result.total);
      setNextPage(result.next_page);
    }).catch((requestError) => {
      if (current) setError(requestError.message || "Could not load job listings.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [filters]);

  async function loadMore() {
    if (visibleCount < jobs.length) {
      setVisibleCount((count) => count + 24);
      return;
    }
    if (nextPage === null || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await getJobs({ ...filters, page: nextPage });
      setJobs((current) => {
        const ids = new Set(current.map((job) => job.id));
        return [...current, ...result.jobs.filter((job) => !ids.has(job.id))];
      });
      setTotal((count) => count + result.total);
      setNextPage(result.next_page);
      setVisibleCount((count) => count + 24);
    } catch (requestError) {
      setError(requestError.message || "Could not load more job listings.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function toggleSaved(job) {
    setSavingIds((current) => new Set(current).add(job.id));
    setError("");
    try {
      if (savedIds.has(job.id)) {
        await removeSavedJob(job.id);
        setSavedIds((current) => { const next = new Set(current); next.delete(job.id); return next; });
      } else {
        await saveJob(job);
        setSavedIds((current) => new Set(current).add(job.id));
      }
    } catch (requestError) {
      setError(requestError.message || "Could not update saved jobs.");
    } finally {
      setSavingIds((current) => { const next = new Set(current); next.delete(job.id); return next; });
    }
  }

  const visibleJobs = jobs.slice(0, visibleCount);
  const canLoadMore = visibleCount < jobs.length || nextPage !== null;

  return (
    <section className="jobs-page">
      <div className="eyebrow"><span className="live-dot" /> LIVE JOB SEARCH</div>
      <h1>Discover jobs</h1>
      <p className="profile-intro">Search current listings from Arbeitnow. Listings currently focus on Germany and Europe.</p>

      <div className="job-search-filters" role="search">
        <label>Keywords
          <input type="search" placeholder="Title, company, skill, or keyword" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>Location
          <input type="search" placeholder="City or region" value={location} onChange={(event) => setLocation(event.target.value)} />
        </label>
        <label>Workplace
          <select value={remote} onChange={(event) => setRemote(event.target.value)}><option value="">Any</option><option value="remote">Remote</option><option value="onsite">Not marked remote</option></select>
        </label>
        <label>Job type
          <input type="search" placeholder="Full time, entry…" value={jobType} onChange={(event) => setJobType(event.target.value)} />
        </label>
      </div>

      <div className="job-results-heading"><strong>{loading ? "Searching…" : `${total} ${total === 1 ? "listing" : "listings"} in these source pages`}</strong><span>Results link to the original listing.</span></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <p role="status" className="jobs-empty-state">Loading live jobs…</p> : visibleJobs.length === 0 ? <p className="jobs-empty-state">No listings match these filters. Try a broader keyword or location.</p> : (
        <div className="discovery-job-list">{visibleJobs.map((job) => <JobCard key={job.id} job={job} isSaved={savedIds.has(job.id)} isSaving={savingIds.has(job.id)} onToggleSave={toggleSaved} />)}</div>
      )}
      {!loading && canLoadMore && <button className="load-more-jobs" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more jobs"}</button>}
      <footer className="jobs-attribution">Job listing data provided by <a href="https://www.arbeitnow.com" target="_blank" rel="noopener noreferrer">Arbeitnow</a>. Verify details on the original posting.</footer>
    </section>
  );
}
