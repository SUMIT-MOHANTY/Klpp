"""
Test script for Policy and Claim models
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from app.models.policy import Policy, PolicyCreate
from app.models.claim import Claim, ClaimCreate, ClaimStatus, ClaimType

def test_policy_creation():
    """Test policy model creation"""
    print("Testing Policy creation...")

    future_date = datetime.now() + timedelta(days=30)

    policy_data = PolicyCreate(
        policy_number="POL-2024-001",
        holder_name="John Doe",
        holder_email="john.doe@example.com",
        holder_phone="+1234567890",
        policy_type="health",
        premium_amount=1000.0,
        deductible=500.0,
        coverage_limit=1000000.0,
        effective_date=datetime.now(),
        expiration_date=future_date
    )

    print(f" Policy created: {policy_data.policy_number}")
    print(f"  Holder: {policy_data.holder_name}")
    print(f"  Email: {policy_data.holder_email}")

    return policy_data

def test_claim_creation():
    """Test claim model creation"""
    print("\nTesting Claim creation...")

    claim_data = ClaimCreate(
        claim_type=ClaimType.ACCIDENT,
        description="Car accident involving minor front bumper damage",
        amount_claimed=2500.0,
        incident_date=datetime.now() - timedelta(days=1),
        incident_location="Main Street, City",
        damage_items=["front bumper", "radiator"],
        witness_info={"name": "Jane Smith", "contact": "jane@example.com"}
    )

    print(f" Claim created with amount: ${claim_data.amount_claimed}")
    print(f"  Type: {claim_data.claim_type}")
    print(f"  Description: {claim_data.description}")

    return claim_data

if __name__ == "__main__":
    try:
        test_policy_creation()
        test_claim_creation()
        print("\n All model tests passed!")
    except Exception as e:
        print(f"\n Test failed: {e}")
        sys.exit(1)
