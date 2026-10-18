
from sqlalchemy import Column, BigInteger, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Environment(Base):
    __tablename__ = "environments"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
