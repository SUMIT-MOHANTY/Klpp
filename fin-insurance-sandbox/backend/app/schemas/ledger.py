# IMMUTABLE LEDGER - do not alter after creation
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class LedgerRecordRequest(BaseModel):
    """Request schema for creating a new ledger transaction."""
    ref_table: str = Field(..., min_length=1, max_length=50, description="Reference table name")
    ref_id: int = Field(..., ge=1, description="Reference ID in the referenced table")
    amount: float = Field(..., gt=0, description="Transaction amount (must be positive)")
    currency: Optional[str] = Field("USD", min_length=3, max_length=3, description="Currency code (ISO 4217)")

    class Config:
        schema_extra = {
            "example": {
                "ref_table": "loans",
                "ref_id": 123,
                "amount": 1500.50,
                "currency": "USD"
            }
        }
