
from sqlalchemy import Column, BigInteger, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class UserGroupMembership(Base):
    __tablename__ = "user_group_memberships"

    id = Column(BigInteger, primary_key=True, index=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    group_id = Column(
        BigInteger,
        ForeignKey("user_groups.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
