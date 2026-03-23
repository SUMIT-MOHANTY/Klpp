from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import enum
import logging

logger = logging.getLogger(__name__)

class ClaimStatus(str, enum.Enum):
    """Enum for claim statuses"""
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SETTLED = "settled"

class ClaimType(str, enum.Enum):
    """Enum for claim types"""
    ACCIDENT = "accident"
    ILLNESS = "illness"
    THEFT = "theft"
    DAMAGE = "damage"
    DEATH = "death"

class Claim(Base):
    """Insurance Claim entity with comprehensive validation and error handling"""

    __tablename__ = "claims"

    # Primary keys
    id = Column(String(36), primary_key=True, default=func.uuid())

    # Foreign keys
    policy_id = Column(String(36), ForeignKey('policies.id'), nullable=False, index=True)

    # Claim information
    claim_number = Column(String(20), unique=True, nullable=False, index=True)
    claim_type = Column(Enum(ClaimType), nullable=False)
    status = Column(Enum(ClaimStatus), default=ClaimStatus.SUBMITTED)

    # Claim details
    description = Column(Text, nullable=False)
    amount_claimed = Column(Float, nullable=False)
    amount_approved = Column(Float, default=0.0)

    # Dates
    incident_date = Column(DateTime, nullable=False)
    submitted_date = Column(DateTime, default=func.now())
    resolved_date = Column(DateTime, nullable=True)

    # Additional info
    incident_location = Column(String(255), nullable=True)
    damage_items = Column(Text, nullable=True)  # JSON list of damaged items
    witness_info = Column(Text, nullable=True)  # JSON object

    # Document management
    documents_attached = Column(String(5), default='no')  # 'yes', 'no'
    supporting_docs = Column(Text, nullable=True)  # JSON list of document URLs

    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    policy = relationship("Policy", back_populates="claims")

    # Validation methods
    def validate_claim_amount(self):
        """Validate claim amount is positive and within policy limits"""
        if self.amount_claimed <= 0:
            raise ValueError("Claim amount must be positive")
        if not self.policy:
            return

        # TODO: Add actual policy limit validation
        # if self.amount_claimed > self.policy.coverage_limit:
        #     raise ValueError("Claim amount exceeds policy coverage limit")

    def validate_dates(self):
        """Validate claim submission and incident dates"""
        if self.incident_date > datetime.now():
            raise ValueError("Incident date cannot be in the future")
        if self.submitted_date and self.submitted_date < self.incident_date:
            raise ValueError("Submission date must be after incident date")

    @classmethod
    def generate_claim_number(cls) -> str:
        """Generate a unique claim number"""
        import uuid
        return f"CLM-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

    def __repr__(self):
        return f"<Claim(claim_number={self.claim_number}, amount={self.amount_claimed})>"

class ClaimCreate(BaseModel):
    """Claim creation schema with comprehensive validation"""
    claim_type: ClaimType
    description: str = Field(..., min_length=10, max_length=1000)
    amount_claimed: float = Field(..., gt=0, lt=1000000)
    incident_date: datetime
    incident_location: Optional[str] = Field(None, max_length=255)
    damage_items: Optional[List[str]] = Field(default_factory=list, max_length=100)
    witness_info: Optional[dict] = Field(default_factory=dict)

    @validator('incident_date')
    def validate_incident_date(cls, v):
        """Ensure incident date is not in the future"""
        if v > datetime.now():
            raise ValueError('Incident date cannot be in the future')
        return v

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ClaimUpdate(BaseModel):
    """Claim update schema"""
    status: Optional[ClaimStatus] = None
    amount_approved: Optional[float] = Field(None, ge=0)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)

    @validator('amount_approved')
    def validate_approved_amount(cls, v):
        """Validate approved amount is positive"""
        if v is not None and v < 0:
            raise ValueError('Approved amount cannot be negative')
        return v

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
