from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import List

from models import Claim, User, get_db, init_db
from sqlalchemy.orm import Session

app = FastAPI(title="Claim Filing API", version="1.0.0")

class ClaimCreate(BaseModel):
    claim_number: str
    policy_number: str
    incident_date: datetime
    incident_description: str
    estimated_amount: Decimal

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}

@app.post("/claims", response_model=dict)
async def create_claim(claim: ClaimCreate, db: Session = Depends(get_db)):
    try:
        db_claim = Claim(**claim.dict())
        db.add(db_claim)
        db.commit()
        db.refresh(db_claim)
        return {"success": True, "claim_id": db_claim.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
