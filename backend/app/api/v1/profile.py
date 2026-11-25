from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.profile import CandidateProfile, CandidateProfileInput
from app.api.v1.schemas.resume import ResumeParseResponse, ResumeProfileSuggestion
from app.core.security import get_current_user
from app.db.models import CandidateProfile as CandidateProfileModel, CandidateUser
from app.db.session import get_db
from app.services.resume_parser import read_resume, suggest_profile

router = APIRouter(prefix="/profile", tags=["profile"])
MAX_RESUME_BYTES = 8 * 1024 * 1024


@router.post("/resume/parse", response_model=ResumeParseResponse)
async def parse_resume(
    file: UploadFile = File(...),
    user: CandidateUser = Depends(get_current_user),
) -> ResumeParseResponse:
    del user  # Parsing is authenticated; the candidate decides whether to save the suggestions.
    content = await file.read(MAX_RESUME_BYTES + 1)
    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Resume file must be 8 MB or smaller")
    try:
        text = read_resume(file.filename or "", content)
    except (ValueError, UnicodeDecodeError) as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The resume file could not be read. Check that it is a valid PDF, DOCX, or TXT file.") from error

    suggestions = ResumeProfileSuggestion(**suggest_profile(text))
    return ResumeParseResponse(
        suggested_profile=suggestions,
        message="Extracted suggestions are unsaved. Review and edit them before choosing Save profile.",
    )


@router.get("", response_model=CandidateProfile)
def get_profile(
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> CandidateProfileModel:
    profile = db.query(CandidateProfileModel).filter_by(user_id=user.id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put("", response_model=CandidateProfile)
def save_profile(
    profile_data: CandidateProfileInput,
    db: Session = Depends(get_db),
    user: CandidateUser = Depends(get_current_user),
) -> CandidateProfileModel:
    profile = db.query(CandidateProfileModel).filter_by(user_id=user.id).first()
    if profile is None:
        profile = CandidateProfileModel(user_id=user.id, **profile_data.model_dump())
        db.add(profile)
    else:
        for field, value in profile_data.model_dump().items():
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
