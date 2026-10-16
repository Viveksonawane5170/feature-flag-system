
from sqlalchemy import (
    Column, BigInteger, String, Integer, Boolean,
    DateTime, ForeignKey
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database.connection import Base


class TargetingRule(Base):
    __tablename__ = "targeting_rules"

    id = Column(BigInteger, primary_key=True, index=True)

    flag_id = Column(
        BigInteger,
        ForeignKey("flags.id"),
        nullable=False
    )

    rule_type = Column(String, nullable=False)
    operator = Column(String, nullable=False)
    attribute = Column(String, nullable=False)

    value = Column(JSONB, nullable=False)
    result = Column(JSONB, nullable=False)

    priority = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
