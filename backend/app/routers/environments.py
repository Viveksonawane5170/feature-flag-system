
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.database.auth_dependencies import require_admin
from app.models import Environment, Flag
from app.schemas.environment import (
    EnvironmentCreate,
    EnvironmentUpdate,
    EnvironmentResponse,
)
from app.schemas.flag import FlagResponse
from app.services import environment_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/environments",
    tags=["Environments"],
    dependencies=[Depends(require_admin)],
)


@router.post("", response_model=EnvironmentResponse,
             status_code=status.HTTP_201_CREATED)
def create_environment(data: EnvironmentCreate, db: Session = Depends(get_db)):
    return environment_service.create_environment(data, db)


@router.get("", response_model=list[EnvironmentResponse])
def list_environments(db: Session = Depends(get_db)):
    return environment_service.list_environments(db)


@router.get("/{environment_id}", response_model=EnvironmentResponse)
def get_environment(environment_id: int, db: Session = Depends(get_db)):
    return environment_service.get_environment(environment_id, db)


@router.put("/{environment_id}", response_model=EnvironmentResponse)
def update_environment(
    environment_id: int,
    data: EnvironmentUpdate,
    db: Session = Depends(get_db),
):
    return environment_service.update_environment(environment_id, data, db)


@router.delete("/{environment_id}")
def delete_environment(environment_id: int, db: Session = Depends(get_db)):
    return environment_service.delete_environment(environment_id, db)


@router.get("/{environment_id}/flags", response_model=list[FlagResponse])
def get_environment_flags(
    environment_id: int,
    db: Session = Depends(get_db),
):
    return environment_service.get_environment_flags(environment_id, db)
