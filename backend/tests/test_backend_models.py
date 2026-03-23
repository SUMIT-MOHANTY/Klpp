import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

# Use declarative_base from sqlalchemy.orm
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Claim(Base):
    __tablename__ = 'claims'

    id = Column(Integer, primary_key=True)
    description = Column(String(500))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

@pytest.fixture
def test_db():
    """Create test database."""
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal()

def test_user_creation(test_db):
    """Test user creation."""
    user = User(email="test@example.com")
    test_db.add(user)
    test_db.commit()
    assert user.id is not None
    assert user.email == "test@example.com"

def test_claim_creation(test_db):
    """Test claim creation."""
    user = User(email="test@example.com")
    test_db.add(user)
    test_db.commit()

    claim = Claim(description="Test claim", user_id=user.id)
    test_db.add(claim)
    test_db.commit()

    assert claim.id is not None
    assert claim.user_id == user.id

def test_user_claims(test_db):
    """Test relationship between user and claims."""
    user = User(email="test@example.com")
    test_db.add(user)
    test_db.commit()

    claim1 = Claim(description="Claim 1", user_id=user.id)
    claim2 = Claim(description="Claim 2", user_id=user.id)
    test_db.add_all([claim1, claim2])
    test_db.commit()

    # This would require proper relationship setup, but just testing basic FK
    assert claim1.user_id == user.id
    assert claim2.user_id == user.id
