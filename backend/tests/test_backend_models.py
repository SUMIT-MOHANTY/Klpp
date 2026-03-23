import pytest
from sqlmodel import Session, create_engine
from backend.src.models.base import Base
from backend.src.models.claim import Claim, User
import os

@pytest.fixture
def engine():
    # Use test database or SQLite
    db_url = os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db")
    engine = create_engine(db_url)
    Base.metadata.create_all(engine)
    return engine

@pytest.fixture
def session(engine):
    with Session(engine) as session:
        yield session

def test_user_creation(session):
    user = User(email="test@example.com")
    session.add(user)
    session.commit()
    assert user.id is not None
    assert user.email == "test@example.com"

def test_claim_creation(session):
    user = User(email="test@example.com")
    session.add(user)
    session.commit()

    claim = Claim(
        user_id=user.id,
        claim_number="CLM-2024-001",
        description="Test claim",
        amount=1000.00
    )
    session.add(claim)
    session.commit()
    assert claim.id is not None
    assert claim.claim_number == "CLM-2024-001"
