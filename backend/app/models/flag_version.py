
from sqlalchemy import Column, BigInteger, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database.connection import Base


class FlagVersion(Base):
    __tablename__ = "flag_versions"

    id = Column(BigInteger, primary_key=True, index=True)

    flag_id = Column(
        BigInteger,
        ForeignKey("flags.id"),
        nullable=False
    )

    version_number = Column(Integer, nullable=False)

    configuration = Column(JSONB, nullable=False)

    created_by = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
