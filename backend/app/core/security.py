import base64
import binascii
import hashlib
import hmac
import json
import secrets
import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import CandidateUser
from app.db.session import get_db

bearer_scheme = HTTPBearer(auto_error=False)
_PBKDF2_ROUNDS = 310_000


def hash_password(password: str) -> str:
    salt = base64.urlsafe_b64encode(secrets.token_bytes(16)).decode().rstrip("=")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ROUNDS)
    encoded = base64.urlsafe_b64encode(digest).decode().rstrip("=")
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt}${encoded}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, rounds, salt, expected = password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        actual = base64.urlsafe_b64encode(
            hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(rounds))
        ).decode().rstrip("=")
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def create_access_token(user_id: int) -> str:
    now = int(time.time())
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64(json.dumps({
        "sub": str(user_id),
        "iat": now,
        "exp": now + settings.access_token_expire_minutes * 60,
    }, separators=(",", ":")).encode())
    signing_input = f"{header}.{payload}"
    signature = _b64(hmac.new(settings.auth_secret_key.encode(), signing_input.encode(), hashlib.sha256).digest())
    return f"{signing_input}.{signature}"


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CandidateUser:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized
    token = credentials.credentials
    try:
        header, payload, signature = token.split(".")
        signing_input = f"{header}.{payload}"
        expected = _b64(hmac.new(settings.auth_secret_key.encode(), signing_input.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            raise unauthorized
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if int(claims["exp"]) <= int(time.time()):
            raise unauthorized
        user_id = int(claims["sub"])
    except (ValueError, KeyError, TypeError, binascii.Error, json.JSONDecodeError):
        raise unauthorized

    user = db.get(CandidateUser, user_id)
    if user is None:
        raise unauthorized
    return user
