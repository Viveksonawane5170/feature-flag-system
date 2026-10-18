
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from app.database.dependencies import get_db
from app.models import User
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

password_hash = PasswordHash.recommended()


# REGISTER API
@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=201
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db)
):
    email = str(payload.email).lower()

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    new_user = User(
        name=payload.name,
        email=email,
        password_hash=password_hash.hash(payload.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# LOGIN API
@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    email = str(payload.email).lower()

    user = db.query(User).filter(
        User.email == email
    ).first()

    # Verify email and password
    if not user or not password_hash.verify(
        payload.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check whether the account is active
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is inactive"
        )

    # Read JWT secret from .env
    secret_key = os.getenv("JWT_SECRET_KEY")

    if not secret_key:
        raise HTTPException(
            status_code=500,
            detail="JWT secret is not configured"
        )

    # Generate JWT token valid for 30 minutes
    token_payload = {
        "sub": str(user.id),
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=30)
    }

    access_token = jwt.encode(
        token_payload,
        secret_key,
        algorithm="HS256"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
