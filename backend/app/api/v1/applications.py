from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.applications import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationStatus,
    ApplicationUpdate,
)
from app.core.security import get_current_user
from app.db.models import CandidateApplication, CandidateUser
from app.db.session import get_db

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=ApplicationListResponse)
def list_applications(
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> ApplicationListResponse:
    query = db.query(CandidateApplication).filter_by(user_id=user.id)
    if status_filter is not None:
        query = query.filter_by(status=status_filter)
    records = query.order_by(CandidateApplication.updated_at.desc(), CandidateApplication.id.desc()).all()
    return ApplicationListResponse(applications=records)


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> CandidateApplication:
    if data.job_id:
        existing = db.query(CandidateApplication).filter_by(user_id=user.id, job_id=data.job_id).first()
        if existing is not None:
            return existing
    application = CandidateApplication(user_id=user.id, **data.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> CandidateApplication:
    application = db.query(CandidateApplication).filter_by(id=application_id, user_id=user.id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    updates = data.model_dump(exclude_unset=True)
    if any(updates.get(field) is None for field in ("title", "company", "status") if field in updates):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Title, company, and status cannot be empty")
    for field, value in updates.items():
        setattr(application, field, value)
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> Response:
    application = db.query(CandidateApplication).filter_by(id=application_id, user_id=user.id).first()
    if application is not None:
        db.delete(application)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
