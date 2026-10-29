import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.database.auth_dependencies import require_admin, get_current_user
from app.models import Flag, Environment
from app.schemas.flag import FlagCreate, FlagUpdate, FlagResponse
from app.services import flag_service

router = APIRouter(
    prefix="/api/v1/flags",
    tags=["Feature Flags"],
    dependencies=[Depends(require_admin)],
)


@router.post("", response_model=FlagResponse, status_code=status.HTTP_201_CREATED)
def create_flag(
    data: FlagCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return flag_service.create_flag(data, db, current_user.id)


@router.get("", response_model=list[FlagResponse])
def list_flags(db: Session = Depends(get_db)):
    return flag_service.get_flags(db)


@router.get("/{flag_id}", response_model=FlagResponse)
def get_flag(flag_id: int, db: Session = Depends(get_db)):
    return flag_service.get_flag(flag_id, db)


@router.put("/{flag_id}", response_model=FlagResponse)
def update_flag(
    flag_id: int,
    data: FlagUpdate,
    db: Session = Depends(get_db),
):
    return flag_service.update_flag(flag_id, data, db)


@router.delete("/{flag_id}")
def delete_flag(flag_id: int, db: Session = Depends(get_db)):
    return flag_service.delete_flag(flag_id, db)
