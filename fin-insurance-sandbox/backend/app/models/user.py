from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(32), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('user', 'bank', 'insurer', name='user_roles'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
