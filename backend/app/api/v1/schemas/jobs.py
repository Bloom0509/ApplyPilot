from datetime import datetime

from pydantic import BaseModel, Field


class MatchReason(BaseModel):
    signal: str
    label: str
    matched: bool
    matched_values: list[str]
    unmatched_values: list[str]
    points: float
    detail: str


class JobListing(BaseModel):
    id: str
    title: str
    company: str
    location: str
    url: str
    description: str
    remote: bool
    tags: list[str]
    job_types: list[str]
    posted_at: datetime | None = None
    source: str = "Arbeitnow"
    match_score: int | None = None
    match_reasons: list[MatchReason] = Field(default_factory=list)


class JobSearchResponse(BaseModel):
    jobs: list[JobListing]
    total: int
    page: int
    next_page: int | None = None
    source: str = "Arbeitnow"
