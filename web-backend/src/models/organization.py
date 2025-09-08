"""
Organization model for multi-tenancy
"""

from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, UUID, Text, Float
from .database import Base
import uuid

class Organization(Base):
    """Organization model for multi-tenant architecture"""

    __tablename__ = "organizations"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic organization information
    name = Column(String(255), nullable=False)
    description = Column(Text)
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    website = Column(String(255))
    logo_url = Column(String(500))

    # Organization type (farmer, cooperative, business, government, ngo)
    organization_type = Column(String(50), nullable=False)

    # Address information (stored as JSON for flexibility)
    address = Column(Text)  # JSON string with address details

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)

    # Subscription information
    subscription_tier = Column(String(50), default="free")
    subscription_expires_at = Column(DateTime)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Organization(id={self.id}, name={self.name}, type={self.organization_type})>"

    def to_dict(self):
        """Convert organization to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "website": self.website,
            "logo_url": self.logo_url,
            "organization_type": self.organization_type,
            "address": self.address,
            "is_active": self.is_active,
            "subscription_tier": self.subscription_tier,
            "subscription_expires_at": self.subscription_expires_at.isoformat() if self.subscription_expires_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def to_public_dict(self):
        """Convert organization to public dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "organization_type": self.organization_type,
            "website": self.website,
            "logo_url": self.logo_url,
            "is_active": self.is_active,
        }
