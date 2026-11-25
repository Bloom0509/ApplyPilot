from pydantic import BaseModel, Field


class ResumeProfileSuggestion(BaseModel):
    full_name: str = ""
    email: str | None = None
    target_roles: list[str] = Field(default_factory=list)
    preferred_locations: list[str] = Field(default_factory=list)
    work_preferences: list[str] = Field(default_factory=list)
    experience: str | None = None
    education: str | None = None
    skills: list[str] = Field(default_factory=list)
    resume_text: str


class ResumeParseResponse(BaseModel):
    suggested_profile: ResumeProfileSuggestion
    message: str
