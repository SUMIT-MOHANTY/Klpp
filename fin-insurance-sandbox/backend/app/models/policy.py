from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class Policy(Base):
    __tablename__ = 'policy'

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False)
    premium = Column(Numeric(10, 2), nullable=False)
    coverage = Column(Numeric(10, 2), nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
