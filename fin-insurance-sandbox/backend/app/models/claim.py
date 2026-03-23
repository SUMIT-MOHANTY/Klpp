"""
Insurance Claim Model

This module contains the Claim model representing insurance claims
submitted against policies in the financial insurance system.
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Enum, Text, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import validates
import uuid
from backend.app import db
import logging

logger = logging.getLogger(__name__)

class ClaimStatus:
    """Enumeration of claim status values."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSING = "processing"

    @classmethod
    def choices(cls):
        """Return list of valid claim statuses."""
        return [cls.PENDING, cls.APPROVED, cls.REJECTED, cls.PROCESSING]

class Claim(db.Model):
    """
    Claim model representing an insurance claim.

    Attributes:
        id: Unique identifier for the claim (UUID)
        policy_id: Foreign key referencing the policy this claim is against
        amount_requested: Amount claimed by the user (decimal with 2 decimal places)
        amount_approved: Amount approved by the insurer (nullable)
        status: Current claim status (pending, approved, rejected, processing)
        description: Description of the claim (max 500 characters)
        documents: JSON object containing document metadata (nullable)
        created_at: Timestamp when claim was created
        updated_at: Timestamp when claim was last modified

    Table name: claims
    """

    __tablename__ = 'claims'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique identifier for the claim"
    )

    policy_id = Column(
        UUID(as_uuid=True),
        ForeignKey('policies.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Foreign key to the policy this claim is against"
    )

    amount_requested = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Amount requested by the claimant"
    )

    amount_approved = Column(
        Numeric(10, 2),
        nullable=True,
        comment="Amount approved by the insurer"
    )

    status = Column(
        String(20),
        Enum(*ClaimStatus.choices(), name='claim_status_enum'),
        nullable=False,
        default=ClaimStatus.PENDING,
        index=True,
        comment="Current processing status of the claim"
    )

    description = Column(
        Text,
        nullable=False,
        comment="Description of the claim (max 500 chars)"
    )

    documents = Column(
        JSON,
        nullable=True,
        comment="JSON metadata for supporting documents"
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        comment="Timestamp when claim was created"
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        comment="Timestamp when claim was last modified"
    )

    # Composite indexes for performance
    __table_args__ = (
        Index('idx_claim_policy_status', 'policy_id', 'status'),
        Index('idx_claim_status_created', 'status', 'created_at'),
    )

    @validates('amount_requested', 'amount_approved')
    def validate_amounts(self, key, value):
        """Validate monetary amounts are non-negative."""
        if value is None:
            return value

        try:
            amount_value = float(value)
            if amount_value < 0:
                raise ValueError(f"{key} must be non-negative")

            # Additional validation for approved amount
            if key == 'amount_approved' and amount_value is not None:
                if hasattr(self, 'amount_requested') and self.amount_requested is not None:
                    if amount_value > float(self.amount_requested):
                        raise ValueError(
                            f"Approved amount ({amount_value}) cannot exceed requested amount ({self.amount_requested})"
                        )

            return value
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid amount value '{value}' for field {key}: {str(e)}")
            raise ValueError(
                f"Invalid amount for {key}: {str(value)}. "
                f"{key} must be a non-negative number. Error: {str(e)}"
            )

    @validates('description')
    def validate_description(self, key, value):
        """Validate description length."""
        if value and len(value) > 500:
            raise ValueError("Description must be 500 characters or less")
        return value

    @validates('policy_id')
    def validate_policy_id(self, key, value):
        """Ensure policy_id is provided and valid."""
        if not value:
            raise ValueError("Policy ID is required")
        return value

    def __repr__(self):
        """Return string representation of the Claim."""
        return f"Claim({self.id}, {self.status})"

    def approve(self, approved_amount, commit=True):
        """
        Approve the claim with specified amount.

        Args:
            approved_amount: Amount to be approved
            commit: Whether to commit the changes immediately
        """
        from backend.app.models.policy import Policy

        try:
            self.amount_approved = approved_amount
            self.status = ClaimStatus.APPROVED
            self.updated_at = datetime.utcnow()

            if commit:
                db.session.commit()
            logger.info(f"Claim {self.id} approved for amount ${approved_amount}")
        except Exception as e:
            logger.error(f"Error approving claim {self.id}: {str(e)}")
            raise

    def reject(self, reason=None, commit=True):
        """
        Reject the claim.

        Args:
            reason: Optional reason for rejection
            commit: Whether to commit the changes immediately
        """
        try:
            self.status = ClaimStatus.REJECTED
            self.amount_approved = 0.00
            self.updated_at = datetime.utcnow()

            if reason:
                logger.warning(f"Claim {self.id} rejected: {reason}")
            else:
                logger.info(f"Claim {self.id} rejected")

            if commit:
                db.session.commit()
        except Exception as e:
            logger.error(f"Error rejecting claim {self.id}: {str(e)}")
            raise

    def to_dict(self):
        """Convert claim to dictionary representation."""
        return {
            'id': str(self.id),
            'policy_id': str(self.policy_id),
            'amount_requested': float(self.amount_requested),
            'amount_approved': float(self.amount_approved) if self.amount_approved else None,
            'status': self.status,
            'description': self.description,
            'documents': self.documents,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
