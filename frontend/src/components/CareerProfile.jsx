import { useEffect, useState } from "react";
import ProfileField from "./ProfileField.jsx";

const emptyProfile = {
  full_name: "",
  email: "",
  target_roles: [],
  preferred_locations: [],
  work_preferences: [],
  experience: "",
  education: "",
  skills: [],
  resume_text: "",
};

const listFields = ["target_roles", "preferred_locations", "work_preferences", "skills"];

function toPayload(draft) {
  const payload = { ...draft };
  for (const field of listFields) {
    payload[field] = String(draft[field] || "")
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return payload;
}

export default function CareerProfile({ profile, profileState, onRetry, onSave }) {
  const [draft, setDraft] = useState(profile || emptyProfile);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => setDraft(profile || emptyProfile), [profile]);

  function update(event) {
    setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSaveMessage("");
    setSaveError("");
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      await onSave(toPayload(draft));
      setSaveMessage("Your profile has been saved.");
    } catch (error) {
      setSaveError(error.message || "We could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (profileState === "loading") {
    return <section className="profile-view"><p role="status">Loading your profile…</p></section>;
  }

  if (profileState.status === "error") {
    return (
      <section className="profile-view">
        <h1>Career profile</h1>
        <p className="form-error" role="alert">{profileState.message || "The profile service could not be reached."}</p>
        <button className="primary-button" onClick={onRetry}>Try again</button>
      </section>
    );
  }

  return (
    <section className="profile-view">
      <div className="eyebrow"><span className="live-dot" /> CANDIDATE CONTROLLED</div>
      <h1>Career profile</h1>
      <p className="profile-intro">Save the details you want ApplyPilot to use for future job matching. You can edit them at any time.</p>
      <div className={`profile-state ${profile ? "saved" : "empty"}`} role="status">
        {profile ? "Profile saved · You can update these details any time." : "No profile saved yet · Add your details below to get started."}
      </div>

      <form className="profile-form" onSubmit={submit}>
        <div className="form-section">
          <h2>About you</h2>
          <div className="form-grid">
            <ProfileField label="Full name *" name="full_name" value={draft.full_name} onChange={update} />
            <ProfileField label="Email" name="email" type="email" value={draft.email} onChange={update} />
          </div>
        </div>

        <div className="form-section">
          <h2>What you’re looking for</h2>
          <div className="form-grid">
            <ProfileField label="Target roles" name="target_roles" value={(draft.target_roles || []).join(", ")} onChange={update} help="Separate entries with commas or new lines." />
            <ProfileField label="Preferred locations" name="preferred_locations" value={(draft.preferred_locations || []).join(", ")} onChange={update} help="Separate entries with commas or new lines." />
            <ProfileField label="Work preferences" name="work_preferences" value={(draft.work_preferences || []).join(", ")} onChange={update} help="For example: remote, hybrid, full-time." />
            <ProfileField label="Skills" name="skills" value={(draft.skills || []).join(", ")} onChange={update} help="Separate entries with commas or new lines." />
          </div>
        </div>

        <div className="form-section">
          <h2>Your background</h2>
          <div className="form-grid">
            <ProfileField label="Experience" name="experience" value={draft.experience} onChange={update} multiline />
            <ProfileField label="Education" name="education" value={draft.education} onChange={update} multiline />
            <ProfileField label="Resume text (optional)" name="resume_text" value={draft.resume_text} onChange={update} multiline help="Paste text if useful. Resume file upload is not available yet." />
          </div>
        </div>

        {saveError && <p className="form-error" role="alert">{saveError}</p>}
        {saveMessage && <p className="form-success" role="status">{saveMessage}</p>}
        <div className="form-actions">
          <span>Saving only stores your profile. It does not submit applications.</span>
          <button className="primary-button" type="submit" disabled={saving || !draft.full_name?.trim()}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
