"""Model tests."""
import pytest
from app.models.policy import PolicyCreate
from app.models.transaction import Transaction

def test_policy_create():
    """Test policy creation validation."""
    policy_data = {
        "policy_number": "POL12345",
        "holder_name": "John Doe",
        "coverage_amount": 100000.0,
        "premium": 500.0
    }

    policy = PolicyCreate(**policy_data)
    assert policy.policy_number == "POL12345"
    assert policy.holder_name == "John Doe"

def test_transaction_creation():
    """Test transaction model."""
    transaction = Transaction(
        id=1,
        policy_id=1,
        amount=100.0,
        transaction_type="premium"
    )
    assert transaction.id == 1
    assert transaction.transaction_type == "premium"

