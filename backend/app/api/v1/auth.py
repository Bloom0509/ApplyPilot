from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.v1.schemas.auth import Account, AuthCredentials, AuthToken, Registration
from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.db.models import CandidateUser
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=AuthToken, status_code=status.HTTP_201_CREATED)
def register(credentials: Registration, db: Session = Depends(get_db)) -> AuthToken:
    user = CandidateUser(email=credentials.email, password_hash=hash_password(credentials.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    db.refresh(user)
    return AuthToken(access_token=create_access_token(user.id))


@router.post("/login", response_model=AuthToken)
def login(credentials: AuthCredentials, db: Session = Depends(get_db)) -> AuthToken:
    user = db.scalar(select(CandidateUser).where(CandidateUser.email == credentials.email))
    if user is None or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return AuthToken(access_token=create_access_token(user.id))


@router.get("/me", response_model=Account)
def get_account(user: CandidateUser = Depends(get_current_user)) -> CandidateUser:
    return user
