"""
Authentication routes for login, registration, and token management
"""

from datetime import datetime, timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from .security import (
    create_access_token,
    get_password_hash,
    verify_password,
    Token
)
from .ldap_auth import authenticate_with_ldap, is_ldap_enabled
from ..models.database import get_db
from ..models.user import User
from ..models.organization import Organization
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])


class UserLogin(BaseModel):
    """User login request model"""
    username: str
    password: str


class UserRegister(BaseModel):
    """User registration request model"""
    username: str
    email: str
    password: str
    first_name: str
    last_name: str
    organization_name: str
    phone: Optional[str] = None


class UserResponse(BaseModel):
    """User response model"""
    id: uuid.UUID
    username: str
    email: str
    first_name: str
    last_name: str
    organization_id: uuid.UUID
    role: str
    is_active: bool

    class Config:
        from_attributes = True


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user by username and password"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """Login endpoint to get access token - supports both LDAP and local authentication"""
    user = None

    # Try LDAP authentication first if enabled
    if is_ldap_enabled():
        user = await authenticate_with_ldap(form_data.username, form_data.password, db)

    # If LDAP failed or disabled, try local authentication
    if not user:
        user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": str(user.id),
            "organization_id": str(user.organization_id),
            "role": user.role,
            "auth_method": "ldap" if is_ldap_enabled() and user.password_hash == get_password_hash("ldap_user") else "local"
        },
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
) -> Any:
    """Register a new user and create their organization"""

    # Check if user already exists
    db_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    # Create organization
    organization = Organization(
        name=user_data.organization_name,
        contact_email=user_data.email,
        organization_type="farmer",  # Default type
        is_active=True
    )
    db.add(organization)
    db.commit()
    db.refresh(organization)

    # Create user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        organization_id=organization.id,
        role="user",
        is_active=True,
        email_verified=False
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/refresh-token", response_model=Token)
async def refresh_access_token(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Refresh access token for authenticated user"""
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={
            "sub": current_user.username,
            "user_id": str(current_user.id),
            "organization_id": str(current_user.organization_id),
            "role": current_user.role
        },
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get current user information"""
    return current_user
