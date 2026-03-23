"""
Insurance Policy Model

This module contains the Policy model representing insurance policies
in the financial insurance system.
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import validates
import uuid
from backend.app import db
import logging

logger = logging.getLogger(__name__)

class InsuranceType:
    """Enumeration of supported insurance types."""
    HEALTH = "health"
    AUTO = "auto"
    LIFE = "life"
    PROPERTY = "property"

    @classmethod
    def choices(cls):
        """Return list of valid insurance types."""
        return [cls.HEALTH, cls.AUTO, cls.LIFE, cls.PROPERTY]

class PolicyStatus:
    """Enumeration of policy status values."""
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

    @classmethod
    def choices(cls):
        """Return list of valid policy statuses."""
        return [cls.ACTIVE, cls.EXPIRED, cls.CANCELLED]

class Policy(db.Model):
    """
    Policy model representing an insurance policy.

    Attributes:
        id: Unique identifier for the policy (UUID)
        user_id: Foreign key referencing the user who owns this policy
        insurance_type: Type of insurance (health, auto, life, property)
        premium: Monthly premium amount (decimal with 2 decimal places)
        start_date: Policy start date and time
        end_date: Policy end date and time
        status: Current policy status (active, expired, cancelled)
        created_at: Timestamp when policy was created
        updated_at: Timestamp when policy was last modified

    Table name: policies
    """

    __tablename__ = 'policies'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique identifier for the policy"
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Foreign key to the user who owns this policy"
    )

    insurance_type = Column(
        String(20),
        Enum(*InsuranceType.choices(), name='insurance_type_enum'),
        nullable=False,
        comment="Type of insurance policy"
    )

    premium = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Monthly premium amount"
    )

    start_date = Column(
        DateTime(timezone=True),
        nullable=False,
        comment="Policy start date and time"
    )

    end_date = Column(
        DateTime(timezone=True),
        nullable=False,
        comment="Policy end date and time"
    )

    status = Column(
        String(20),
        Enum(*PolicyStatus.choices(), name='policy_status_enum'),
        nullable=False,
        default=PolicyStatus.ACTIVE,
        index=True,
        comment="Current policy status"
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        comment="Timestamp when policy was created"
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        comment="Timestamp when policy was last modified"
    )

    # Composite indexes for performance
    __table_args__ = (
        Index('idx_policy_user_type', 'user_id', 'insurance_type'),
        Index('idx_policy_status_dates', 'status', 'start_date', 'end_date'),
    )

    # Relationships
    claims = db.relationship(
        'Claim',
        backref='policy',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    @validates('premium')
    def validate_premium(self, key, value):
        """Validate premium amount is greater than zero."""
        try:
            premium_value = float(value)
            if premium_value <= 0:
                raise ValueError("Premium must be greater than 0")
            return value
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid premium value '{value}': {str(e)}")
            raise ValueError(
                f"Premium must be a positive number. "
                f"Provided: {value}. Error: {str(e)}"
            )

    @validates('start_date', 'end_date')
    def validate_date_range(self, key, value):
        """Validate date range logic."""
        if key == 'start_date':
            # Store for comparison when end_date is validated
            self._start_date_cache = value
        elif key == 'end_date':
            # Check against cached start_date if not yet committed
            start_date = getattr(self, '_start_date_cache', None)
            if start_date is None:
                # Fresh instance, check actual stored value
                start_date = self.start_date

            if start_date is None:
                raise ValueError("Start date is required")

            if value <= start_date:
                raise ValueError(
                    f"End date ({value}) must be after start date ({start_date})"
                )
        return value

    def __repr__(self):
        """Return string representation of the Policy."""
        return f"Policy({self.id}, {self.insurance_type})"

    def is_active(self):
        """Check if the policy is currently active."""
        return (
            self.status == PolicyStatus.ACTIVE and
            self.start_date <= datetime.utcnow() <= self.end_date
        )

    def to_dict(self):
        """Convert policy to dictionary representation."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'insurance_type': self.insurance_type,
            'premium': float(self.premium),
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
