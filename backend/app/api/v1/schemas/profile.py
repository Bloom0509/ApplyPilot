import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CandidateProfileInput(BaseModel):
    full_name: str = Field(min_length=1, max_length=160)
    email: str | None = Field(default=None, max_length=320)
    target_roles: list[str] = Field(default_factory=list, max_length=30)
    preferred_locations: list[str] = Field(default_factory=list, max_length=30)
    work_preferences: list[str] = Field(default_factory=list, max_length=10)
    experience: str | None = Field(default=None, max_length=30000)
    education: str | None = Field(default=None, max_length=12000)
    skills: list[str] = Field(default_factory=list, max_length=100)
    resume_text: str | None = Field(default=None, max_length=50000)

    @field_validator("full_name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank")
        return value

    @field_validator("email")
    @classmethod
    def email_must_be_valid_when_provided(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        value = value.strip()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("target_roles", "preferred_locations", "work_preferences", "skills")
    @classmethod
    def trim_list_values(cls, values: list[str]) -> list[str]:
        return [value.strip() for value in values if value.strip()]


class CandidateProfile(CandidateProfileInput):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    updated_at: datetime
