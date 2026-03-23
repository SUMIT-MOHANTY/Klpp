"""
User model for the fin-insurance-sandbox application.

This module defines the database schema for users including role-based access
control for the insurance platform.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app import db

class User(db.Model):
    """User model representing account holders in the insurance platform."""

    __tablename__ = 'user'

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # User credentials
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # Role-based access control
    role = Column(
        Enum('admin', 'underwriter', 'agent', 'customer',
             name='user_role'),
        nullable=False
    )

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self):
        """String representation of User instance."""
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}', role='{self.role}')>"

    def to_dict(self):
        """Convert User instance to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
