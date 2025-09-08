"""
Organizations API routes
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from ..models.database import get_db
from ..models.organization import Organization

router = APIRouter(prefix="/organizations", tags=["organizations"])

# Pydantic models for API requests/responses
class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    organization_type: str
    address: Optional[str] = None
    subscription_tier: str = "free"

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    organization_type: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None
    subscription_tier: Optional[str] = None

class OrganizationResponse(OrganizationBase):
    id: str
    is_active: bool
    subscription_expires_at: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class OrganizationListResponse(BaseModel):
    organizations: List[OrganizationResponse]
    count: int

@router.get("/", response_model=OrganizationListResponse)
async def get_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all organizations with pagination"""
    organizations = db.query(Organization).offset(skip).limit(limit).all()
    return {
        "organizations": [OrganizationResponse.model_validate(org) for org in organizations],
        "count": len(organizations)
    }

@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    organization: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """Create a new organization"""
    # Check if organization with same name already exists
    existing_org = db.query(Organization).filter(Organization.name == organization.name).first()
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this name already exists"
        )

    # Create new organization
    db_org = Organization(
        name=organization.name,
        description=organization.description,
        contact_email=organization.contact_email,
        contact_phone=organization.contact_phone,
        website=organization.website,
        logo_url=organization.logo_url,
        organization_type=organization.organization_type,
        address=organization.address,
        subscription_tier=organization.subscription_tier,
        is_active=True
    )

    db.add(db_org)
    db.commit()
    db.refresh(db_org)

    return OrganizationResponse.model_validate(db_org)

@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific organization by ID"""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organization ID format"
        )

    organization = db.query(Organization).filter(Organization.id == org_uuid).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    return OrganizationResponse.model_validate(organization)

@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    org_update: OrganizationUpdate,
    db: Session = Depends(get_db)
):
    """Update an organization"""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organization ID format"
        )

    organization = db.query(Organization).filter(Organization.id == org_uuid).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Check for name conflicts if name is being updated
    update_data = org_update.model_dump(exclude_unset=True)
    if 'name' in update_data:
        existing = db.query(Organization).filter(
            Organization.name == update_data['name'],
            Organization.id != org_uuid
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization with this name already exists"
            )

    # Update organization fields
    for field, value in update_data.items():
        setattr(organization, field, value)

    db.commit()
    db.refresh(organization)

    return OrganizationResponse.model_validate(organization)

@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: str,
    db: Session = Depends(get_db)
):
    """Delete an organization (soft delete by setting is_active to False)"""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organization ID format"
        )

    organization = db.query(Organization).filter(Organization.id == org_uuid).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Soft delete - just mark as inactive
    organization.is_active = False
    db.commit()

    return None

@router.get("/{org_id}/users")
async def get_organization_users(
    org_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all users belonging to an organization"""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organization ID format"
        )

    # Check if organization exists
    organization = db.query(Organization).filter(Organization.id == org_uuid).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Import User model here to avoid circular imports
    from ..models.user import User

    users = db.query(User).filter(User.organization_id == org_uuid).offset(skip).limit(limit).all()

    # Convert to response format
    from .users import UserResponse
    return {
        "users": [UserResponse.model_validate(user) for user in users],
        "count": len(users)
    }
