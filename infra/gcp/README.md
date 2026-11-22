# Deployment notes

The frontend and API should be deployed as separate Cloud Run services. Configure the frontend with the deployed API base URL. Configure the API with managed PostgreSQL/pgvector and Redis endpoints, OpenAI credentials, and LangSmith settings through Cloud Run environment configuration or Secret Manager.

The current scaffold includes Docker build files. Production infrastructure, secret provisioning, migrations, and GitHub Actions deployment workflows will be added after the application endpoints and runtime settings are established.
