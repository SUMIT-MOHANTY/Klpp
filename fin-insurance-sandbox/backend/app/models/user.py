from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import validates
import re

# Create enum for user roles
from enum import Enum as PyEnum

class UserRole(PyEnum):
    USER = "user"
    INSURANCE_AGENT = "insurance_agent"
    BANK_AGENT = "bank_agent"
    ADMIN = "admin"

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @validates('email')
    def validate_email(self, key, address):
        """Validate email format"""
        if not address:
            raise ValueError("Email is required")
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', address):
            raise ValueError("Invalid email format")
        return address

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role.name})>"
