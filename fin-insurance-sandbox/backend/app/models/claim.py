from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.models.base import Base

class Claim(Base):
    __tablename__ = 'claim'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    policy_id = Column(Integer, ForeignKey('policy.id'), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum('pending', 'approved', 'rejected', name='claim_status'), nullable=False, default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
