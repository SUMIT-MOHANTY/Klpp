from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from .base import Base
import uuid

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    claim_number = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    amount = Column(Numeric(10, 2))
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=None)
    updated_at = Column(DateTime, default=None)

    user = relationship("User", back_populates="claims")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    claims = relationship("Claim", back_populates="user")
