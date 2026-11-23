# ApplyPilot

AI-assisted job search and application workspace. Candidate data stays under candidate control, and application submissions require review and approval.

## Stack

- Frontend: React + JavaScript with Vite
- API: Python + FastAPI, validated with Pydantic
- Agent orchestration and RAG: LangGraph + LangChain with custom retrieval
- LLM and embeddings: OpenAI
- Data: PostgreSQL + pgvector
- Cache and background work: Redis + Celery
- Browser automation: Playwright
- Observability: LangSmith
- Containers and deployment: Docker + Google Cloud Run

## Project layout

- frontend/ — React application
- backend/ — FastAPI service, agent modules, workflows, retrieval, and Celery tasks
- infra/docker/ — container build files
- infra/gcp/ — Cloud Run deployment notes and configuration
- docs/ — architecture and API documentation
- .github/workflows/ — CI/CD workflow location

## Local development

1. Copy .env.example to .env and add an OpenAI API key when using LLM features.
2. Start PostgreSQL with pgvector and Redis:

   docker compose up -d

3. Install the API into a Python 3.11+ environment and apply the initial database migration:

   pip install -e backend
   alembic -c backend/alembic.ini upgrade head

4. From the project root, run the API:

   uvicorn app.main:app --app-dir backend --reload

5. In another terminal, install and run the frontend:

   cd frontend
   npm install
   npm run dev

The web app runs at http://localhost:5173. API docs run at http://localhost:8000/docs, with health at http://localhost:8000/api/v1/health.

## Current scope

The candidate profile API is the first persisted workflow. The dashboard still uses sample data, and sign-in, resume extraction, job source integrations, matching, application generation, and submission integrations are planned next. The initial profile API is single-workspace and is not ready for multi-user deployment until authentication and candidate ownership are added.
