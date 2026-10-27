
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
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

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/environments",
    tags=["Environments"],
    dependencies=[Depends(require_admin)],
)


@router.post("", response_model=EnvironmentResponse,
             status_code=status.HTTP_201_CREATED)
def create_environment(data: EnvironmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Environment).filter(
        Environment.name == data.name
    ).first()

    if existing:
        raise HTTPException(409, "Environment name already exists")

    environment = Environment(
        name=data.name,
        description=data.description,
    )

    try:
        db.add(environment)
        db.commit()
        db.refresh(environment)
        return environment
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Error creating environment")
        raise HTTPException(500, "Database error while creating environment")


@router.get("", response_model=list[EnvironmentResponse])
def list_environments(db: Session = Depends(get_db)):
    return db.query(Environment).order_by(Environment.id.desc()).all()


@router.get("/{environment_id}", response_model=EnvironmentResponse)
def get_environment(environment_id: int, db: Session = Depends(get_db)):
    environment = db.query(Environment).filter(
        Environment.id == environment_id
    ).first()

    if not environment:
        raise HTTPException(404, "Environment not found")

    return environment


@router.put("/{environment_id}", response_model=EnvironmentResponse)
def update_environment(
    environment_id: int,
    data: EnvironmentUpdate,
    db: Session = Depends(get_db),
):
    environment = db.query(Environment).filter(
        Environment.id == environment_id
    ).first()

    if not environment:
        raise HTTPException(404, "Environment not found")

    changes = data.model_dump(exclude_unset=True)

    if "name" in changes and changes["name"] != environment.name:
        duplicate = db.query(Environment).filter(
            Environment.name == changes["name"]
        ).first()

        if duplicate:
            raise HTTPException(409, "Environment name already exists")

    for field, value in changes.items():
        setattr(environment, field, value)

    try:
        db.commit()
        db.refresh(environment)
        return environment
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Error updating environment")
        raise HTTPException(500, "Database error while updating environment")


@router.delete("/{environment_id}")
def delete_environment(environment_id: int, db: Session = Depends(get_db)):
    environment = db.query(Environment).filter(
        Environment.id == environment_id
    ).first()

    if not environment:
        raise HTTPException(404, "Environment not found")

    related_flags = db.query(Flag).filter(
        Flag.environment_id == environment_id
    ).first()

    if related_flags:
        raise HTTPException(
            409,
            "Cannot delete environment while flags are linked to it",
        )

    try:
        db.delete(environment)
        db.commit()
        return {
            "message": "Environment deleted successfully",
            "environment_id": environment_id,
        }
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Error deleting environment")
        raise HTTPException(500, "Database error while deleting environment")


@router.get("/{environment_id}/flags", response_model=list[FlagResponse])
def get_environment_flags(
    environment_id: int,
    db: Session = Depends(get_db),
):
    environment = db.query(Environment).filter(
        Environment.id == environment_id
    ).first()

    if not environment:
        raise HTTPException(404, "Environment not found")

    return db.query(Flag).filter(
        Flag.environment_id == environment_id
    ).order_by(Flag.id.desc()).all()
