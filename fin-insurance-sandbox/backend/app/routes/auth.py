from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
import time
from collections import defaultdict

from backend.app.models.user import User, UserRole
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
)
from backend.app.utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

# Import from existing app structure
from backend.app import app

# Rate limiting storage
rate_limit_storage = defaultdict(lambda: {"count": 0, "window": 0})
MAX_REQUESTS_PER_MINUTE = 5

def rate_limit(request: Request):
    """Rate limiting middleware - 5 requests per minute per IP"""
    client_ip = request.client.host
    current_time = int(time.time())

    # Reset counter if window has passed
    if current_time - rate_limit_storage[client_ip]["window"] >= 60:
        rate_limit_storage[client_ip] = {"count": 0, "window": current_time}

    # Check if limit exceeded
    if rate_limit_storage[client_ip]["count"] >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a minute before trying again."
        )

    # Increment counter
    rate_limit_storage[client_ip]["count"] += 1

# Dependency to get database session
def get_db():
    """Get database session - connect to existing app structure"""
    from backend.app import get_session
    return get_session()

# Create router
router = APIRouter(prefix="/api/v1")

@router.post("/users/register", response_model=UserResponse)
async def register_user(
    request: Request,
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user with email and password"""
    # Apply rate limiting
    rate_limit(request)

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=UserRole.USER  # Default role as user
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user. Please try again."
        )

    return UserResponse.from_orm(new_user)

@router.post("/auth/login", response_model=TokenResponse)
async def login_user(
    request: Request,
    credentials: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user and return JWT tokens"""
    # Apply rate limiting
    rate_limit(request)

    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create tokens
    user_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    access_token = create_access_token(user_data)
    refresh_token = create_refresh_token(user_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=3600
    )

@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Generate new access token using refresh token"""
    # Apply rate limiting
    rate_limit(request)

    # Decode refresh token
    payload = decode_token(refresh_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Get user from token
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Generate new access token
    user_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    new_access_token = create_access_token(user_data)

    # Generate new refresh token
    new_refresh_token = create_refresh_token(user_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=3600
    )

# Register router with app
app.include_router(router, tags=["Authentication"])
