import logging
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Environment, Flag

logger = logging.getLogger(__name__)

def list_environments(db: Session):
    return db.query(Environment).order_by(Environment.id.desc()).all()

def get_environment(environment_id: int, db: Session):
    environment = db.query(Environment).filter(Environment.id == environment_id).first()
    if not environment:
        raise HTTPException(404, "Environment not found")
    return environment

def create_environment(data, db: Session):
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

def update_environment(environment_id: int, data, db: Session):
    environment = get_environment(environment_id, db)

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

def delete_environment(environment_id: int, db: Session):
    environment = get_environment(environment_id, db)

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

def get_environment_flags(environment_id: int, db: Session):
    environment = get_environment(environment_id, db)
    return db.query(Flag).filter(
        Flag.environment_id == environment_id
    ).order_by(Flag.id.desc()).all()
