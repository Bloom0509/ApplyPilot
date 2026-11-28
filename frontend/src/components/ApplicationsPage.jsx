import { useEffect, useMemo, useState } from "react";
import { createApplication, deleteApplication, getApplications, updateApplication } from "../services/api.js";

const statuses = ["interested", "applied", "interviewing", "offer", "rejected", "withdrawn"];
const statusLabels = {
  interested: "Interested",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function localToday() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function dateLabel(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "";
}

function reminderLabel(value) {
  if (!value) return "";
  if (value < localToday()) return `Follow-up overdue · ${dateLabel(value)}`;
  if (value === localToday()) return "Follow-up due today";
  return `Follow-up · ${dateLabel(value)}`;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newApplication, setNewApplication] = useState({
    title: "", company: "", location: "", job_url: "", status: "interested",
    applied_at: "", notes: "", follow_up_date: "",
  });

  useEffect(() => {
    let current = true;
    getApplications().then((result) => {
      if (current) setApplications(result.applications);
    }).catch((requestError) => {
      if (current) setError(requestError.message || "Could not load applications.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const visibleApplications = useMemo(() => (
    statusFilter === "all"
      ? applications
      : applications.filter((application) => application.status === statusFilter)
  ), [applications, statusFilter]);

  const activeReminders = applications.filter((application) => (
    application.follow_up_date && !["offer", "rejected", "withdrawn"].includes(application.status)
  ));
  const overdueCount = activeReminders.filter((application) => application.follow_up_date < localToday()).length;
  const dueSoonCount = activeReminders.filter((application) => {
    const days = (new Date(`${application.follow_up_date}T00:00:00`) - new Date(`${localToday()}T00:00:00`)) / 86400000;
    return days >= 0 && days <= 7;
  }).length;

  function changeNewApplication(field, value) {
    setNewApplication((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const created = await createApplication({
        ...newApplication,
        location: newApplication.location || null,
        job_url: newApplication.job_url || null,
        applied_at: newApplication.applied_at || null,
        notes: newApplication.notes || null,
        follow_up_date: newApplication.follow_up_date || null,
      });
      setApplications((current) => [created, ...current]);
      setNewApplication({ title: "", company: "", location: "", job_url: "", status: "interested", applied_at: "", notes: "", follow_up_date: "" });
      setMessage("Application added to your tracker.");
    } catch (requestError) {
      setError(requestError.message || "Could not add the application.");
    } finally {
      setSaving(false);
    }
  }

  function getDraft(application) {
    return drafts[application.id] || {
      status: application.status,
      applied_at: application.applied_at || "",
      notes: application.notes || "",
      follow_up_date: application.follow_up_date || "",
    };
  }

  function changeDraft(application, field, value) {
    setDrafts((current) => ({
      ...current,
      [application.id]: { ...getDraft(application), [field]: value },
    }));
  }

  async function handleUpdate(application) {
    const draft = getDraft(application);
    setSavingId(application.id);
    setError("");
    setMessage("");
    try {
      const updated = await updateApplication(application.id, {
        status: draft.status,
        applied_at: draft.applied_at || null,
        notes: draft.notes || null,
        follow_up_date: draft.follow_up_date || null,
      });
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDrafts((current) => { const next = { ...current }; delete next[application.id]; return next; });
      setMessage("Application updated.");
    } catch (requestError) {
      setError(requestError.message || "Could not update this application.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(application) {
    setRemovingId(application.id);
    setError("");
    try {
      await deleteApplication(application.id);
      setApplications((current) => current.filter((item) => item.id !== application.id));
      setDrafts((current) => { const next = { ...current }; delete next[application.id]; return next; });
    } catch (requestError) {
      setError(requestError.message || "Could not remove this application.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="applications-page">
      <div className="eyebrow"><span className="live-dot" /> APPLICATION WORKSPACE</div>
      <h1>Applications</h1>
      <p className="profile-intro">Track each opportunity, keep notes, and set a date to follow up.</p>

      <div className="application-reminder-summary" aria-live="polite">
        <strong>{overdueCount ? `${overdueCount} overdue follow-up${overdueCount === 1 ? "" : "s"}` : "No overdue follow-ups"}</strong>
        <span>{dueSoonCount} follow-up{dueSoonCount === 1 ? "" : "s"} due in the next 7 days</span>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}

      <details className="application-create-panel" open>
        <summary>Add an application</summary>
        <form className="application-form" onSubmit={handleCreate}>
          <label>Job title<input required maxLength="300" value={newApplication.title} onChange={(event) => changeNewApplication("title", event.target.value)} /></label>
          <label>Company<input required maxLength="200" value={newApplication.company} onChange={(event) => changeNewApplication("company", event.target.value)} /></label>
          <label>Location<input maxLength="300" value={newApplication.location} onChange={(event) => changeNewApplication("location", event.target.value)} /></label>
          <label>Job link<input type="url" maxLength="2000" placeholder="https://…" value={newApplication.job_url} onChange={(event) => changeNewApplication("job_url", event.target.value)} /></label>
          <label>Status<select value={newApplication.status} onChange={(event) => changeNewApplication("status", event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
          <label>Applied date<input type="date" value={newApplication.applied_at} onChange={(event) => changeNewApplication("applied_at", event.target.value)} /></label>
          <label>Follow-up date<input type="date" value={newApplication.follow_up_date} onChange={(event) => changeNewApplication("follow_up_date", event.target.value)} /></label>
          <label className="application-notes-field">Notes<textarea rows="3" maxLength="10000" value={newApplication.notes} onChange={(event) => changeNewApplication("notes", event.target.value)} /></label>
          <button className="primary-button" type="submit" disabled={saving}>{saving ? "Adding…" : "Add application"}</button>
        </form>
      </details>

      <div className="applications-toolbar">
        <h2>Your applications <span>{applications.length}</span></h2>
        <label>Filter by status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
      </div>

      {loading ? <p role="status" className="jobs-empty-state">Loading applications…</p> : visibleApplications.length === 0 ? (
        <p className="jobs-empty-state">{applications.length ? "No applications match this status." : "Your tracker is empty. Add an application above to get started."}</p>
      ) : (
        <div className="application-list">
          {visibleApplications.map((application) => {
            const draft = getDraft(application);
            const reminder = reminderLabel(application.follow_up_date);
            const overdue = reminder.startsWith("Follow-up overdue");
            return (
              <article className="application-card" key={application.id}>
                <header className="application-card-header">
                  <div><h3>{application.title}</h3><p>{application.company}{application.location ? ` · ${application.location}` : ""}</p></div>
                  {application.job_url && <a href={application.job_url} target="_blank" rel="noopener noreferrer">Open listing ↗</a>}
                </header>
                {reminder && !["offer", "rejected", "withdrawn"].includes(application.status) && <p className={`application-reminder ${overdue ? "is-overdue" : ""}`}>{reminder}</p>}
                <div className="application-edit-grid">
                  <label>Status<select value={draft.status} onChange={(event) => changeDraft(application, "status", event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
                  <label>Applied date<input type="date" value={draft.applied_at} onChange={(event) => changeDraft(application, "applied_at", event.target.value)} /></label>
                  <label>Follow-up date<input type="date" value={draft.follow_up_date} onChange={(event) => changeDraft(application, "follow_up_date", event.target.value)} /></label>
                  <label className="application-notes-field">Notes<textarea rows="3" maxLength="10000" value={draft.notes} onChange={(event) => changeDraft(application, "notes", event.target.value)} /></label>
                </div>
                <footer className="application-card-actions">
                  <button className="primary-button" type="button" onClick={() => handleUpdate(application)} disabled={savingId === application.id}>{savingId === application.id ? "Saving…" : "Save changes"}</button>
                  <button className="application-remove-button" type="button" onClick={() => handleDelete(application)} disabled={removingId === application.id}>{removingId === application.id ? "Removing…" : "Remove"}</button>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
