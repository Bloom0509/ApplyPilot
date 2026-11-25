# API starting point

The API is versioned under `/api/v1`. The health endpoint is `GET /api/v1/health`. FastAPI publishes an interactive schema at `/docs` during local development.

## Authentication and candidate profile

Registration and login return a bearer access token. Send it as `Authorization: Bearer <token>` to protected endpoints. Access tokens expire after the configured `ACCESS_TOKEN_EXPIRE_MINUTES` (12 hours by default). Each authenticated account can access only its own profile. Passwords are stored as salted PBKDF2 hashes. Set a long random `AUTH_SECRET_KEY` in the environment before deployment.

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create an account and return an access token. Requires a valid email and a password of at least 10 characters. |
| POST | `/api/v1/auth/login` | Verify credentials and return an access token. |
| GET | `/api/v1/auth/me` | Return the signed-in account. |

## Candidate profile

The profile endpoints require authentication and scope reads and writes to the signed-in account. They accept candidate-provided profile facts.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/v1/profile` | Return the saved profile, or `404` if no profile has been saved. |
| PUT | `/api/v1/profile` | Create or replace the signed-in candidate's profile. Validation errors return `422` with field details. |
| POST | `/api/v1/profile/resume/parse` | Upload a PDF, DOCX, or TXT file (multipart field `file`, maximum 8 MB). Returns extracted text and suggested profile fields without saving them. |

The profile contains a required `full_name`; optional `email`, `experience`, `education`, and `resume_text`; and lists for `target_roles`, `preferred_locations`, `work_preferences`, and `skills`. A successful response includes `created_at` and `updated_at`. Resume parsing is local and heuristic; extracted values are suggestions and must be reviewed and saved explicitly by the candidate. Scanned PDFs require OCR and currently return a no-text error.

When upgrading a database that contains the old shared profile, the migration leaves that row unassigned so it cannot be exposed to whichever account registers first. Re-enter its details under the intended account after upgrading.

Apply database migrations before starting the API:

```powershell
alembic -c backend/alembic.ini upgrade head
```

Planned resource groups after the profile workflow include job listings, match evaluations, application drafts, application status events, and follow-up reminders.
