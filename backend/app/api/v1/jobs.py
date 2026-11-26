from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.jobs import JobSearchResponse
from app.core.security import get_current_user
from app.db.models import CandidateUser
from app.db.models import CandidateProfile as CandidateProfileModel
from app.db.session import get_db
from app.services.matching import score_job
from app.services.jobs_provider import JobSourceError, search_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=JobSearchResponse)
def get_jobs(
    q: str | None = Query(default=None, max_length=120, description="Search title, company, description, tags, and job type"),
    location: str | None = Query(default=None, max_length=120),
    remote: bool | None = None,
    job_type: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1, le=1000),
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> JobSearchResponse:
    profile = db.query(CandidateProfileModel).filter_by(user_id=user.id).first()
    try:
        jobs, total, next_page = search_jobs(
            query=q,
            location=location,
            remote=remote,
            job_type=job_type,
            page=page,
        )
    except JobSourceError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
    jobs = [score_job(job, profile) for job in jobs]
    jobs.sort(key=lambda job: job.match_score if job.match_score is not None else -1, reverse=True)
    return JobSearchResponse(jobs=jobs, total=total, page=page, next_page=next_page)
