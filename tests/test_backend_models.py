import pytest
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    claims = relationship("Claim", back_populates="user")

class Claim(Base):
    __tablename__ = 'claims'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    amount = Column(Integer)
    user = relationship("User", back_populates="claims")

@pytest.fixture
def test_db():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    return engine

def test_user_model_creation(test_db):
    Session = sessionmaker(bind=test_db)
    session = Session()
    user = User(email="test@example.com")
    session.add(user)
    session.commit()
    assert user.id is not None

def test_claim_model_creation(test_db):
    Session = sessionmaker(bind=test_db)
    session = Session()
    user = User(email="test@example.com")
    session.add(user)
    session.commit()

    claim = Claim(user_id=user.id, amount=1000)
    session.add(claim)
    session.commit()
    assert claim.id is not None
