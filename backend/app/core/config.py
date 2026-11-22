from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ApplyPilot"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://applypilot:applypilot@localhost:5432/applypilot"
    redis_url: str = "redis://localhost:6379/0"
    openai_api_key: str | None = None
    langsmith_api_key: str | None = None
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
