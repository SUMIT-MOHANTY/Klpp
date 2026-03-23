from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import uuid
import datetime

from db.database import SessionLocal
from app.models.policy import Policy, PolicyCreate
from app.models.transaction import Transaction, TransactionCreate

ledger_bp = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@ledger_bp.get("/policies", response_model=List[PolicyCreate])
async def get_policies(db: Session = Depends(get_db)):
    try:
        policies = db.query(Policy).all()
        return [PolicyCreate.model_validate(policy) for policy in policies]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ledger_bp.post("/policies", response_model=PolicyCreate)
async def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    try:
        db_policy = Policy(**policy.dict())
        db.add(db_policy)
        db.commit()
        db.refresh(db_policy)
        return PolicyCreate.model_validate(db_policy)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@ledger_bp.post("/transactions", response_model=TransactionCreate)
async def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    try:
        db_transaction = Transaction(**transaction.dict())
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return TransactionCreate.model_validate(db_transaction)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
