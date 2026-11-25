import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AuthCredentials(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=10, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"


class Account(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str


class Registration(AuthCredentials):
    pass
