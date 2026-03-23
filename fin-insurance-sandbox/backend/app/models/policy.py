from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class Policy(Base):
    """Insurance Policy entity with comprehensive error handling and validation"""

    __tablename__ = "policies"

    # Primary keys
    id = Column(String(36), primary_key=True, default=func.uuid())

    # Policy information
    policy_number = Column(String(20), unique=True, nullable=False, index=True)
    holder_name = Column(String(100), nullable=False)
    holder_email = Column(String(255), nullable=False, index=True)
    holder_phone = Column(String(20), nullable=True)

    # Policy details
    policy_type = Column(String(50), nullable=False)  # 'health', 'auto', 'life', 'property'
    premium_amount = Column(Float, nullable=False)
    deductible = Column(Float, default=0.0)
    coverage_limit = Column(Float, nullable=False)

    # Status and dates
    status = Column(String(20), default='active', nullable=False)  # active, expired, cancelled
    effective_date = Column(DateTime, nullable=False)
    expiration_date = Column(DateTime, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    claims = relationship("Claim", back_populates="policy", cascade="all, delete-orphan")

    def validate_policy_dates(self):
        """Validate policy dates are logical"""
        if self.effective_date and self.expiration_date:
            if self.expiration_date <= self.effective_date:
                raise ValueError("Expiration date must be after effective date")

    @validator('premium_amount', 'coverage_limit')
    def validate_amounts(cls, v):
        """Validate monetary amounts are positive"""
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

    @validator('holder_email')
    def validate_email(cls, v):
        """Validate email format"""
        if '@' not in v or '.' not in v.split('@')[1]:
            raise ValueError('Invalid email format')
        return v

    def __repr__(self):
        return f"<Policy(policy_number={self.policy_number}, holder={self.holder_name})>"

class PolicyCreate(BaseModel):
    """Policy creation schema with comprehensive validation"""
    policy_number: str = Field(..., min_length=3, max_length=20, description="Unique policy number")
    holder_name: str = Field(..., min_length=2, max_length=100)
    holder_email: str = Field(..., regex=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    holder_phone: Optional[str] = Field(None, max_length=20)
    policy_type: str = Field(..., regex=r'^(health|auto|life|property)$')
    premium_amount: float = Field(..., gt=0)
    deductible: float = Field(default=0.0, ge=0)
    coverage_limit: float = Field(..., gt=0)
    effective_date: datetime
    expiration_date: datetime

    @validator('effective_date', 'expiration_date')
    def validate_dates(cls, v):
        """Ensure dates are not in the past and are logical"""
        if v < datetime.now():
            raise ValueError('Cannot use past dates')
        return v

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
