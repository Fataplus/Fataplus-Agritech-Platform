"""
LDAP Authentication module for Cloudron integration
"""

import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from ldap3 import Server, Connection, ALL, SUBTREE
from ldap3.core.exceptions import LDAPException, LDAPBindError, LDAPInvalidCredentialsResult

from .security import get_password_hash, verify_password
from ..models.user import User
from ..models.organization import Organization
from ..models.database import get_db
from sqlalchemy.orm import Session

# LDAP Configuration
LDAP_SERVER = os.getenv("LDAP_SERVER", "localhost")
LDAP_PORT = int(os.getenv("LDAP_PORT", "389"))
LDAP_USE_SSL = os.getenv("LDAP_USE_SSL", "false").lower() == "true"
LDAP_BASE_DN = os.getenv("LDAP_BASE_DN", "dc=cloudron,dc=local")
LDAP_BIND_DN = os.getenv("LDAP_BIND_DN", "")
LDAP_BIND_PASSWORD = os.getenv("LDAP_BIND_PASSWORD", "")
LDAP_USER_SEARCH_FILTER = os.getenv("LDAP_USER_SEARCH_FILTER", "(uid={username})")
LDAP_USER_DN_ATTRIBUTE = os.getenv("LDAP_USER_DN_ATTRIBUTE", "dn")
LDAP_USER_DISPLAY_NAME_ATTRIBUTE = os.getenv("LDAP_USER_DISPLAY_NAME_ATTRIBUTE", "cn")
LDAP_USER_EMAIL_ATTRIBUTE = os.getenv("LDAP_USER_EMAIL_ATTRIBUTE", "mail")

logger = logging.getLogger(__name__)


class LDAPAuthenticator:
    """LDAP Authentication handler for Cloudron"""

    def __init__(self):
        self.server = Server(
            LDAP_SERVER,
            port=LDAP_PORT,
            use_ssl=LDAP_USE_SSL,
            get_info=ALL
        )

    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user against LDAP server
        Returns user info dict if successful, None if failed
        """
        try:
            # First, bind with service account to search for user
            if LDAP_BIND_DN and LDAP_BIND_PASSWORD:
                conn = Connection(self.server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
            else:
                # Anonymous bind for search
                conn = Connection(self.server, auto_bind=True)

            # Search for user
            search_filter = LDAP_USER_SEARCH_FILTER.format(username=username)
            conn.search(
                LDAP_BASE_DN,
                search_filter,
                SUBTREE,
                attributes=[LDAP_USER_DN_ATTRIBUTE, LDAP_USER_DISPLAY_NAME_ATTRIBUTE, LDAP_USER_EMAIL_ATTRIBUTE]
            )

            if not conn.entries:
                logger.warning(f"User {username} not found in LDAP")
                conn.unbind()
                return None

            user_entry = conn.entries[0]
            user_dn = str(user_entry[LDAP_USER_DN_ATTRIBUTE])
            display_name = str(user_entry[LDAP_USER_DISPLAY_NAME_ATTRIBUTE])
            email = str(user_entry[LDAP_USER_EMAIL_ATTRIBUTE]) if LDAP_USER_EMAIL_ATTRIBUTE in user_entry else ""

            conn.unbind()

            # Now try to bind with user's credentials
            user_conn = Connection(self.server, user_dn, password, auto_bind=True)
            user_conn.unbind()

            # If we get here, authentication was successful
            return {
                "username": username,
                "display_name": display_name,
                "email": email,
                "dn": user_dn
            }

        except LDAPInvalidCredentialsResult:
            logger.warning(f"Invalid credentials for user {username}")
            return None
        except LDAPException as e:
            logger.error(f"LDAP error for user {username}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during LDAP authentication for {username}: {str(e)}")
            return None

    def get_user_info(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from LDAP without authentication
        """
        try:
            if LDAP_BIND_DN and LDAP_BIND_PASSWORD:
                conn = Connection(self.server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
            else:
                conn = Connection(self.server, auto_bind=True)

            search_filter = LDAP_USER_SEARCH_FILTER.format(username=username)
            conn.search(
                LDAP_BASE_DN,
                search_filter,
                SUBTREE,
                attributes=[LDAP_USER_DN_ATTRIBUTE, LDAP_USER_DISPLAY_NAME_ATTRIBUTE, LDAP_USER_EMAIL_ATTRIBUTE]
            )

            if not conn.entries:
                conn.unbind()
                return None

            user_entry = conn.entries[0]
            user_info = {
                "username": username,
                "display_name": str(user_entry[LDAP_USER_DISPLAY_NAME_ATTRIBUTE]),
                "email": str(user_entry[LDAP_USER_EMAIL_ATTRIBUTE]) if LDAP_USER_EMAIL_ATTRIBUTE in user_entry else "",
                "dn": str(user_entry[LDAP_USER_DN_ATTRIBUTE])
            }

            conn.unbind()
            return user_info

        except Exception as e:
            logger.error(f"Error getting LDAP user info for {username}: {str(e)}")
            return None


# Global LDAP authenticator instance
ldap_authenticator = LDAPAuthenticator()


async def authenticate_with_ldap(username: str, password: str, db: Session) -> Optional[User]:
    """
    Authenticate user with LDAP and sync with local database
    """
    # Try LDAP authentication first
    ldap_user = ldap_authenticator.authenticate_user(username, password)

    if ldap_user:
        # LDAP authentication successful, sync with local database
        user = sync_ldap_user_to_db(ldap_user, db)
        return user

    return None


def sync_ldap_user_to_db(ldap_user: Dict[str, Any], db: Session) -> User:
    """
    Sync LDAP user information to local database
    """
    # Check if user already exists
    user = db.query(User).filter(User.username == ldap_user["username"]).first()

    if user:
        # Update existing user with latest LDAP info
        user.first_name = ldap_user["display_name"].split()[0] if ldap_user["display_name"] else ""
        user.last_name = " ".join(ldap_user["display_name"].split()[1:]) if ldap_user["display_name"] else ""
        user.email = ldap_user["email"] or f"{ldap_user['username']}@local"
        user.updated_at = datetime.utcnow()
    else:
        # Get or create default organization
        org = db.query(Organization).filter(Organization.name == "Cloudron Users").first()
        if not org:
            org = Organization(
                name="Cloudron Users",
                description="Users authenticated via Cloudron LDAP",
                organization_type="business",
                is_active=True
            )
            db.add(org)
            db.commit()
            db.refresh(org)

        # Create new user
        hashed_password = get_password_hash("ldap_user")  # Placeholder password for LDAP users
        user = User(
            username=ldap_user["username"],
            email=ldap_user["email"] or f"{ldap_user['username']}@local",
            password_hash=hashed_password,
            first_name=ldap_user["display_name"].split()[0] if ldap_user["display_name"] else "",
            last_name=" ".join(ldap_user["display_name"].split()[1:]) if ldap_user["display_name"] else "",
            organization_id=org.id,
            role="user",
            is_active=True,
            email_verified=True  # LDAP users are pre-verified
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    return user


def is_ldap_enabled() -> bool:
    """
    Check if LDAP authentication is enabled
    """
    return os.getenv("LDAP_ENABLED", "false").lower() == "true"
