from sqlalchemy import Column, Integer, String, DateTime, Numeric
from sqlalchemy.sql import func
from pydantic import BaseModel
import datetime

from app.models import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_number = Column(String, unique=True, index=True)
    insured_amount = Column(Numeric(10, 2))
    premium_amount = Column(Numeric(10, 2))
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Policy {self.policy_number}>"

class PolicyCreate(BaseModel):
    policy_number: str
    insured_amount: float
    premium_amount: float
    start_date: datetime.datetime
    end_date: datetime.datetime

    class Config:
        from_attributes = True
