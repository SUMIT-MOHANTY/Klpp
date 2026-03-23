"""Transaction models."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Transaction(BaseModel):
    id: int
    policy_id: int
    amount: float = Field(..., gt=0)
    transaction_type: str = Field(..., regex='^(premium|claim)$')
    created_at: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = Field(None, max_length=500)

    class Config:
        from_attributes = True
