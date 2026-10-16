
from sqlalchemy import (
    Column, BigInteger, String, Boolean, Text,
    DateTime, ForeignKey
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database.connection import Base


class Flag(Base):
    __tablename__ = "flags"

    id = Column(BigInteger, primary_key=True, index=True)

    environment_id = Column(
        BigInteger,
        ForeignKey("environments.id"),
        nullable=False
    )

    key = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, default="boolean")
    default_value = Column(JSONB, nullable=False, default=False)
    enabled = Column(Boolean, nullable=False, default=False)
    description = Column(Text, nullable=True)
    owner_team = Column(String, nullable=True)

    created_by = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
