# ApplyPilot architecture

## Initial request flow

The React client will call the versioned FastAPI API. The API owns validation and persistence. Longer-running work will be queued through Celery and Redis. LangGraph workflows will coordinate specialist agents, and PostgreSQL with pgvector will store candidate-approved profile data and retrieval embeddings.

## Candidate-controlled workflow

1. Candidate reviews and confirms extracted profile facts.
2. Discovery and matching produce explainable results tied to profile evidence.
3. Resume, cover letter, and application answers are generated as drafts.
4. The application workflow pauses for candidate review and approval.
5. Tracking and follow-up reminders continue after the candidate records or authorizes an application action.

## Planned modules

- app/agents/ — profile, discovery, JD analysis, matching, resume, cover letter, application, tracking, supervisor agents
- app/workflows/ — LangGraph state, graph construction, and workflow policies
- app/rag/ — document chunking, embeddings, pgvector retrieval, and grounded context
- app/integrations/ — job sources and authorized application providers
- app/tasks/ — Celery jobs for long-running or scheduled work
- app/api/v1/ — HTTP endpoints and Pydantic request/response schemas
