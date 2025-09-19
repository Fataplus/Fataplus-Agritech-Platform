"""
User model for Fataplus platform
"""

from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, UUID, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base
import uuid

class User(Base):
    """User model representing platform users"""

    __tablename__ = "users"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Organization relationship (for multi-tenancy)
    organization_id = Column(UUID(as_uuid=True), nullable=False)

    # Basic user information
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    email_verified = Column(Boolean, default=False)
    phone = Column(String(50))
    phone_verified = Column(Boolean, default=False)

    # Personal information
    first_name = Column(String(100))
    last_name = Column(String(100))
    profile_picture_url = Column(String(500))

    # Role and permissions
    role = Column(String(50), nullable=False, default="user")  # admin, manager, user

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)

    # Authentication
    password_hash = Column(String(255))

    # Email verification and password reset
    email_verification_token = Column(String(255))
    email_verification_expires_at = Column(DateTime)
    password_reset_token = Column(String(255))
    password_reset_expires_at = Column(DateTime)

    # Session tracking
    last_login_at = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"

    @property
    def full_name(self):
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.username

    def to_dict(self):
        """Convert user to dictionary (for API responses)"""
        return {
            "id": str(self.id),
            "organization_id": str(self.organization_id),
            "username": self.username,
            "email": self.email,
            "email_verified": self.email_verified,
            "phone": self.phone,
            "phone_verified": self.phone_verified,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "profile_picture_url": self.profile_picture_url,
            "role": self.role,
            "is_active": self.is_active,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def to_public_dict(self):
        """Convert user to public dictionary (safe for public APIs)"""
        return {
            "id": str(self.id),
            "username": self.username,
            "full_name": self.full_name,
            "profile_picture_url": self.profile_picture_url,
            "is_active": self.is_active,
        }
