from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Decimal, Boolean, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os

# Use declarative_base from sqlalchemy.orm (SQLAlchemy 2.0)
Base = declarative_base()

class Claim(Base):
    __tablename__ = 'claims'

    id = Column(Integer, primary_key=True)
    claim_number = Column(String(50), unique=True, nullable=False)
    policy_number = Column(String(50), nullable=False)
    incident_date = Column(DateTime, nullable=False)
    incident_description = Column(Text, nullable=False)
    estimated_amount = Column(Decimal(10, 2), nullable=False)
    status = Column(String(20), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(100), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)

# Database setup
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///backend/claims.db')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        return True
    except Exception as e:
        print(f"Database initialization failed: {e}")
        return False

def get_db():
    """Get database session - FastAPI dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
