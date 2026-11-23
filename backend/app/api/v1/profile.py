from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.profile import CandidateProfile, CandidateProfileInput
from app.db.models import CandidateProfile as CandidateProfileModel
from app.db.session import get_db

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=CandidateProfile)
def get_profile(db: Session = Depends(get_db)) -> CandidateProfileModel:
    profile = db.get(CandidateProfileModel, 1)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put("", response_model=CandidateProfile)
def save_profile(
    profile_data: CandidateProfileInput,
    db: Session = Depends(get_db),
) -> CandidateProfileModel:
    profile = db.get(CandidateProfileModel, 1)
    if profile is None:
        profile = CandidateProfileModel(id=1, **profile_data.model_dump())
        db.add(profile)
    else:
        for field, value in profile_data.model_dump().items():
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
