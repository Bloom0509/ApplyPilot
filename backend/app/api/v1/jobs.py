from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.jobs import JobListing, JobSearchResponse, SavedJobItem, SavedJobsResponse
from app.core.security import get_current_user
from app.db.models import CandidateUser, SavedJob
from app.db.models import CandidateProfile as CandidateProfileModel
from app.db.session import get_db
from app.services.matching import score_job
from app.services.jobs_provider import JobSourceError, search_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/saved", response_model=SavedJobsResponse)
def get_saved_jobs(
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> SavedJobsResponse:
    saved = (
        db.query(SavedJob)
        .filter_by(user_id=user.id)
        .order_by(SavedJob.saved_at.desc(), SavedJob.id.desc())
        .all()
    )
    return SavedJobsResponse(
        jobs=[SavedJobItem(job=entry.job_data, saved_at=entry.saved_at) for entry in saved]
    )


@router.post("/saved", response_model=SavedJobItem, status_code=status.HTTP_201_CREATED)
def save_job(
    job: JobListing,
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> SavedJobItem:
    entry = db.query(SavedJob).filter_by(user_id=user.id, job_id=job.id).first()
    if entry is None:
        entry = SavedJob(user_id=user.id, job_id=job.id, job_data=job.model_dump(mode="json"))
        db.add(entry)
    else:
        entry.job_data = job.model_dump(mode="json")
    db.commit()
    db.refresh(entry)
    return SavedJobItem(job=entry.job_data, saved_at=entry.saved_at)


@router.delete("/saved", status_code=status.HTTP_204_NO_CONTENT)
def remove_saved_job(
    job_id: str = Query(min_length=1, max_length=1000),
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> Response:
    entry = db.query(SavedJob).filter_by(user_id=user.id, job_id=job_id).first()
    if entry is not None:
        db.delete(entry)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
