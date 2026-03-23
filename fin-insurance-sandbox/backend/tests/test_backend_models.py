import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models import User, Policy, Claim

@pytest.fixture
def db_session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_user_model(db_session):
    user = User(username='testuser', password_hash='hash', role='user')
    db_session.add(user)
    db_session.commit()
    assert user.id is not None
    assert user.username == 'testuser'

def test_policy_model(db_session):
    user = User(username='testuser', password_hash='hash', role='user')
    db_session.add(user)
    db_session.commit()

    policy = Policy(product_name='Test Policy', premium=100.00, coverage=1000.00, user_id=user.id)
    db_session.add(policy)
    db_session.commit()
    assert policy.id is not None
    assert policy.user_id == user.id

def test_claim_model(db_session):
    user = User(username='testuser', password_hash='hash', role='user')
    db_session.add(user)
    db_session.commit()

    policy = Policy(product_name='Test Policy', premium=100.00, coverage=1000.00, user_id=user.id)
    db_session.add(policy)
    db_session.commit()

    claim = Claim(title='Test Claim', description='Test description', policy_id=policy.id, amount=500.00)
    db_session.add(claim)
    db_session.commit()
    assert claim.id is not None
    assert claim.policy_id == policy.id
    assert claim.status == 'pending'
