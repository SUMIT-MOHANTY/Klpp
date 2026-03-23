"""Ledger routes."""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.transaction import Transaction

ledger_bp = APIRouter(prefix="/ledger")

@ledger_bp.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    """Get all transactions."""
    return []

@ledger_bp.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: dict):
    """Create a new transaction."""
    try:
        tx = Transaction(
            id=1,
            policy_id=transaction.get('policy_id', 1),
            amount=transaction.get('amount', 100.0),
            transaction_type=transaction.get('transaction_type', 'premium'),
            description=transaction.get('description', '')
        )
        return tx
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
