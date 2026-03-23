from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel
import datetime

from app.models import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id"))
    transaction_type = Column(String)
    amount = Column(Numeric(10, 2))
    transaction_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    policy = relationship("Policy", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction {self.transaction_id}>"

class TransactionCreate(BaseModel):
    transaction_id: str
    policy_id: int
    transaction_type: str
    amount: float
    transaction_date: datetime.datetime

    class Config:
        from_attributes = True

# Add reverse relationship to Policy
from app.models.policy import Policy
Policy.transactions = relationship("Transaction", back_populates="policy")
