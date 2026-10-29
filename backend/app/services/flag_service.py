import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Flag, Environment
from app.schemas.flag import FlagCreate, FlagUpdate

logger = logging.getLogger(__name__)

def get_flags(db: Session):
    return db.query(Flag).order_by(Flag.id.desc()).all()

def get_flag(flag_id: int, db: Session):
    flag = db.query(Flag).filter(Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    return flag

def create_flag(data: FlagCreate, db: Session, current_user_id: int):
    environment = db.query(Environment).filter(
        Environment.id == data.environment_id
    ).first()

    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found")

    duplicate = db.query(Flag).filter(
        Flag.environment_id == data.environment_id,
        Flag.key == data.key,
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Flag key already exists in this environment",
        )

    flag = Flag(
        key=data.key,
        type=data.type,
        default_value=data.default_value,
        enabled=data.enabled,
        description=data.description,
        environment_id=data.environment_id,
        owner_team=data.owner_team,
        created_by=current_user_id,
    )

    db.add(flag)
    try:
        db.commit()
        db.refresh(flag)
        return flag
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Could not create flag")

def update_flag(flag_id: int, data: FlagUpdate, db: Session):
    flag = db.query(Flag).filter(Flag.id == flag_id).first()

    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    changes = data.model_dump(exclude_unset=True)

    if "environment_id" in changes:
        environment = db.query(Environment).filter(
            Environment.id == changes["environment_id"]
        ).first()

        if not environment:
            raise HTTPException(status_code=404, detail="Environment not found")

    new_environment_id = changes.get("environment_id", flag.environment_id)
    new_key = changes.get("key", flag.key)

    duplicate = db.query(Flag).filter(
        Flag.environment_id == new_environment_id,
        Flag.key == new_key,
        Flag.id != flag_id,
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Flag key already exists in this environment",
        )

    for field, value in changes.items():
        setattr(flag, field, value)

    try:
        db.commit()
        db.refresh(flag)
        return flag
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Could not update flag")

def delete_flag(flag_id: int, db: Session):
    flag = db.query(Flag).filter(Flag.id == flag_id).first()

    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    db.delete(flag)
    try:
        db.commit()
        return {
            "message": "Flag deleted successfully",
            "flag_id": flag_id,
        }
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Flag cannot be deleted because related records reference it",
        )
