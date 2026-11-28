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

## Job search

`GET /api/v1/jobs` requires a bearer token. It requests a page from the live Arbeitnow job-board API and applies the search filters to that page. Results contain the title, company, location, remote flag, tags, job types, a plain-text description excerpt, posted date, source listing URL, `match_score`, and `match_reasons`. Jobs are ordered by descending score when profile signals are available.

Matching is deterministic and uses only saved candidate-provided data: target roles (30%), skills (45%), preferred locations (15%), and work preferences (10%). A dimension is included only when the candidate has saved values for it; the remaining weights are normalized to 100%. `match_reasons` reports matched and unmatched values and each signal's contribution. If no matching fields have been saved, `match_score` is `null` and listings retain source order. This is a transparent heuristic, not a hiring recommendation or a guarantee of job fit.

| Query parameter | Behavior |
| --- | --- |
| `q` | Case-insensitive terms matched against title, company, description, tags, and job type. All terms must match. |
| `location` | Case-insensitive substring of the job location. |
| `remote` | `true` returns remote listings; `false` returns those not marked remote. |
| `job_type` | Case-insensitive substring match against job types. |
| `page` | Provider page number, starting at 1. |

Provider pages are cached in-process for five minutes. Arbeitnow listings are Europe-focused. The API requires a visible link back to Arbeitnow; its terms say to contact the provider for commercial use.

## Saved jobs

Saved listings are stored as candidate-owned snapshots, so they remain available even if the live source removes or changes a listing. All endpoints require authentication and only return or change the signed-in candidate's saved jobs.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/v1/jobs/saved` | List saved listings, newest first. |
| POST | `/api/v1/jobs/saved` | Save a job listing snapshot. Saving the same listing again updates its snapshot without creating a duplicate. |
| DELETE | `/api/v1/jobs/saved?job_id=<listing-id>` | Remove a saved listing. Repeating the request is safe. |

Apply database migrations before using these endpoints; the saved-jobs table is added by revision `20261127_0003`.

## Application tracking

Application records are private to the signed-in candidate. Status values are `interested`, `applied`, `interviewing`, `offer`, `rejected`, and `withdrawn`. Follow-up dates are stored as calendar dates and surfaced in the Applications page as due, upcoming, or overdue reminders.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/v1/applications` | List the signed-in candidate's applications, newest activity first. Accepts an optional `status` filter. |
| POST | `/api/v1/applications` | Create an application record. `title` and `company` are required; listing URL, location, status, applied date, notes, and follow-up date are optional. |
| PATCH | `/api/v1/applications/{application_id}` | Update status, dates, notes, or listing details for an owned record. |
| DELETE | `/api/v1/applications/{application_id}` | Delete an owned application record. |

Migration revision `20261128_0004` creates the application table. Apply it with `alembic -c backend/alembic.ini upgrade head` before using these endpoints.

Apply database migrations before starting the API:

```powershell
alembic -c backend/alembic.ini upgrade head
```

Planned resource groups after the profile workflow include job listings, match evaluations, application drafts, application status events, and follow-up reminders.
