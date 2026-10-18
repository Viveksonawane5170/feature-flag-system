
from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database.connection import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, index=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=True
    )

    flag_id = Column(
        BigInteger,
        ForeignKey("flags.id"),
        nullable=True
    )

    action = Column(String, nullable=False)
    before_value = Column(JSONB, nullable=True)
    after_value = Column(JSONB, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
