import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.models import Base
from app.models.policy import Policy, PolicyCreate
from app.models.transaction import Transaction, TransactionCreate

@pytest.fixture(scope="module")
def test_db():
    """Create a test database and session"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def test_policy_creation(test_db):
    """Test creating a policy"""
    policy = Policy(
        policy_number="POL123",
        insured_amount=10000.0,
        premium_amount=100.0,
        start_date=datetime.now(),
        end_date=datetime.now()
    )

    test_db.add(policy)
    test_db.commit()

    assert policy.id is not None
    assert policy.policy_number == "POL123"
    assert policy.insured_amount == 10000.0

def test_transaction_creation(test_db):
    """Test creating a transaction linked to a policy"""
    # First create a policy
    policy = Policy(
        policy_number="POL456",
        insured_amount=5000.0,
        premium_amount=50.0,
        start_date=datetime.now(),
        end_date=datetime.now()
    )
    test_db.add(policy)
    test_db.commit()

    # Create transaction
    transaction = Transaction(
        transaction_id="TXN789",
        policy_id=policy.id,
        transaction_type="PREMIUM",
        amount=50.0,
        transaction_date=datetime.now()
    )

    test_db.add(transaction)
    test_db.commit()

    assert transaction.id is not None
    assert transaction.policy_id == policy.id
    assert transaction.transaction_type == "PREMIUM"

def test_policy_model_validation():
    """Test Pydantic model validation"""
    policy_data = {
        "policy_number": "POL999",
        "insured_amount": 15000.0,
        "premium_amount": 150.0,
        "start_date": datetime.now(),
        "end_date": datetime.now()
    }

    policy = PolicyCreate(**policy_data)
    assert policy.policy_number == "POL999"
    assert policy.insured_amount == 15000.0
