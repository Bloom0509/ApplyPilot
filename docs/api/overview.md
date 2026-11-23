# API starting point

The API is versioned under `/api/v1`. The health endpoint is `GET /api/v1/health`. FastAPI publishes an interactive schema at `/docs` during local development.

## Candidate profile (first workflow)

The initial profile API supports one candidate workspace until authentication and per-candidate ownership are implemented. It accepts candidate-provided profile facts; resume parsing and AI extraction are not part of this API yet.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/v1/profile` | Return the saved profile, or `404` if no profile has been saved. |
| PUT | `/api/v1/profile` | Create or replace the workspace profile. Validation errors return `422` with field details. |

The profile contains a required `full_name`; optional `email`, `experience`, `education`, and `resume_text`; and lists for `target_roles`, `preferred_locations`, `work_preferences`, and `skills`. A successful response includes `created_at` and `updated_at`.

Apply database migrations before starting the API:

```powershell
alembic -c backend/alembic.ini upgrade head
```

Planned resource groups after the profile workflow include job listings, match evaluations, application drafts, application status events, and follow-up reminders.
