from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

ApplicationStatus = Literal["interested", "applied", "interviewing", "offer", "rejected", "withdrawn"]


class ApplicationCreate(BaseModel):
    job_id: str | None = Field(default=None, max_length=1000)
    title: str = Field(min_length=1, max_length=300)
    company: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=300)
    job_url: str | None = Field(default=None, max_length=2000)
    status: ApplicationStatus = "interested"
    applied_at: date | None = None
    notes: str | None = Field(default=None, max_length=10000)
    follow_up_date: date | None = None


class ApplicationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    company: str | None = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=300)
    job_url: str | None = Field(default=None, max_length=2000)
    status: ApplicationStatus | None = None
    applied_at: date | None = None
    notes: str | None = Field(default=None, max_length=10000)
    follow_up_date: date | None = None


class ApplicationResponse(BaseModel):
    id: int
    job_id: str | None
    title: str
    company: str
    location: str | None
    job_url: str | None
    status: ApplicationStatus
    applied_at: date | None
    notes: str | None
    follow_up_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApplicationListResponse(BaseModel):
    applications: list[ApplicationResponse]
