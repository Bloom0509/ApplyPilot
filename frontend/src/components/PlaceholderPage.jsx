export default function PlaceholderPage({ page, onBack }) {
  const description = page === "Discover jobs"
    ? "Job source integrations and matching are planned next."
    : "Application tracking will be added after job matching.";

  return (
    <section className="placeholder-view">
      <div className="eyebrow"><span className="live-dot" /> WORKSPACE PREVIEW</div>
      <h1>{page}</h1>
      <p>{description}</p>
      <button className="primary-button" onClick={onBack}>← Back to overview</button>
    </section>
  );
}
