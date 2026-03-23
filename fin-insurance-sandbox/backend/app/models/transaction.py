# IMMUTABLE LEDGER - do not alter after creation
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Decimal as SqlDecimal, DateTime, func
from app.db import Base

class Transaction(Base):
    """
    Immutable ledger transaction model.
    Once created, transaction records cannot be updated or deleted.
    """
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True)
    txn_hash = Column(String(128), unique=True, nullable=False, index=True)
    ref_table = Column(String(50), nullable=False, index=True)
    ref_id = Column(Integer, nullable=False)
    amount = Column(SqlDecimal(15, 2), nullable=False, default=Decimal('0.00'))
    currency = Column(String(3), nullable=False, default='USD')
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Transaction {self.txn_hash}: {self.amount} {self.currency}>"

    def to_dict(self):
        """Convert transaction to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'txn_hash': self.txn_hash,
            'ref_table': self.ref_table,
            'ref_id': self.ref_id,
            'amount': float(self.amount),  # Convert Decimal to float for JSON
            'currency': self.currency,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
