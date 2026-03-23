"""Policy models."""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class PolicyCreate(BaseModel):
    policy_number: str = Field(..., description="Unique policy identifier")
    holder_name: str = Field(..., min_length=2, max_length=100)
    coverage_amount: float = Field(..., gt=0)
    premium: float = Field(..., gt=0)

    @validator('policy_number')
    def validate_policy_number(cls, v):
        if not v or len(v) < 5:
            raise ValueError('Policy number must be at least 5 characters')
        return v

class Policy(PolicyCreate):
    id: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
