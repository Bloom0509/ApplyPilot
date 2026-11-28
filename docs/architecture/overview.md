# ApplyPilot architecture

## Initial request flow

The React client will call the versioned FastAPI API. The API owns validation and persistence. Longer-running work will be queued through Celery and Redis. LangGraph workflows will coordinate specialist agents, and PostgreSQL with pgvector will store candidate-approved profile data and retrieval embeddings.

## Candidate-controlled workflow

1. Candidate reviews and confirms extracted profile facts.
2. Job discovery retrieves live postings and deterministic matching reports which saved profile signals contributed to each score.
3. Resume, cover letter, and application answers are generated as drafts.
4. The application workflow pauses for candidate review and approval.
5. Candidate-owned application records track status, dates, notes, and follow-up reminders after the candidate chooses to pursue a listing.

## First usable workflow: candidate profile

The first end-to-end product workflow lets an authenticated candidate create a profile, review it, and save it for later job matching. Resume import extracts local text and basic details as editable suggestions before the candidate chooses to save.

### Candidate journey

1. The candidate opens Career profile and chooses to create or edit their profile.
2. They enter contact details, target roles and locations, work preferences, experience, education, and skills, or upload a PDF, DOCX, or TXT resume to prefill suggestions.
3. The app validates required fields and shows a review summary before saving.
4. The candidate edits any field, then saves the profile.
5. The app confirms the save and displays the saved profile when the candidate returns.

Candidate accounts authenticate with expiring bearer tokens. Every profile read and write is scoped to the authenticated account. Resume file parsing returns suggestions without persistence; the candidate reviews and edits the suggested values before saving them.

### Initial scope and product rules

- A candidate account can have one editable profile in this first release.
- Profile fields are candidate-provided; do not infer or silently alter facts.
- Required fields should be limited to what is needed to begin matching. Optional fields remain clearly optional.
- Resume suggestions are heuristic and may be incomplete; extracted facts must be presented for candidate review before they become confirmed profile data.
- Saving a profile does not submit applications or share profile data with employers.

### Acceptance criteria

- A candidate can create, read, update, and save a profile.
- Invalid input receives field-level feedback and is not saved.
- A successful save survives an API or page restart and is shown on the next visit.
- The profile screen shows whether the profile is empty, loading, saved, or failed to save.
- Profile data is scoped to its authenticated candidate owner.
- Passwords are stored only as salted hashes; access tokens are signed with a configured secret and expire.

## Planned modules

- app/agents/ — profile, discovery, JD analysis, matching, resume, cover letter, application, tracking, supervisor agents
- app/workflows/ — LangGraph state, graph construction, and workflow policies
- app/rag/ — document chunking, embeddings, pgvector retrieval, and grounded context
- app/integrations/ — additional job sources and authorized application providers; the first Arbeitnow connector currently lives in `app/services/jobs_provider.py`
- app/tasks/ — Celery jobs for long-running or scheduled work
- app/api/v1/ — HTTP endpoints and Pydantic request/response schemas
