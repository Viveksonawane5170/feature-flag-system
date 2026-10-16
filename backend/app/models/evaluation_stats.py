
from sqlalchemy import (
    Column, BigInteger, Integer, Date, ForeignKey
)

from app.database.connection import Base


class EvaluationStats(Base):
    __tablename__ = "evaluation_stats"

    id = Column(BigInteger, primary_key=True, index=True)

    flag_id = Column(
        BigInteger,
        ForeignKey("flags.id"),
        nullable=False
    )

    environment_id = Column(
        BigInteger,
        ForeignKey("environments.id"),
        nullable=False
    )

    date = Column(Date, nullable=False)
    hour = Column(Integer, nullable=False)

    evaluation_count = Column(
        BigInteger,
        nullable=False,
        default=0
    )
