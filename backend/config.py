"""Configuration module."""
import os
from typing import Optional

class Config:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    TEST_DATABASE_URL: str = "sqlite:///:memory:"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "test-secret-key")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
