from pydantic_settings import BaseSettings, SettingsConfigDict


from pydantic import model_validator


class Settings(BaseSettings):
    app_name: str = "ApplyPilot"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://postgres:root@localhost:5432/applypilot"
    redis_url: str = "redis://localhost:6379/0"
    auth_secret_key: str = "change-this-development-secret-before-deploying"
    access_token_expire_minutes: int = 720
    openai_api_key: str | None = None
    langsmith_api_key: str | None = None
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def production_auth_secret_must_be_configured(self):
        if self.environment.lower() in {"production", "prod"} and (
            len(self.auth_secret_key) < 32
            or self.auth_secret_key in {
                "change-this-development-secret-before-deploying",
                "replace-with-a-long-random-secret",
            }
        ):
            raise ValueError("Set AUTH_SECRET_KEY to a random value of at least 32 characters in production")
        return self


settings = Settings()
