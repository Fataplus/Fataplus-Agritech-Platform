#!/usr/bin/env python3
"""
Fataplus Data Encryption System
Comprehensive data encryption with key management and secure storage
"""

import os
import json
import base64
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from enum import Enum
from dataclasses import dataclass, field
import redis
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import constant_time
from fastapi import HTTPException, Request, status
from pydantic import BaseModel, Field, validator

# Configure logging
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

# Encryption Configuration
ENCRYPTION_KEY_PREFIX = "encryption_key"
MASTER_KEY_SALT = os.getenv("ENCRYPTION_MASTER_KEY_SALT", "fataplus-master-salt")
KEY_ROTATION_DAYS = 90


class EncryptionAlgorithm(Enum):
    """Supported encryption algorithms"""
    AES_256_GCM = "aes_256_gcm"
    AES_256_CBC = "aes_256_cbc"
    FERNET = "fernet"
    RSA_2048 = "rsa_2048"
    RSA_4096 = "rsa_4096"


class KeyStatus(Enum):
    """Key status"""
    ACTIVE = "active"
    ROTATING = "rotating"
    DEPRECATED = "deprecated"
    REVOKED = "revoked"


@dataclass
class EncryptionKey:
    """Encryption key information"""
    key_id: str
    algorithm: EncryptionAlgorithm
    key_material: str  # Encrypted key material
    key_hash: str
    tenant_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    status: KeyStatus = KeyStatus.ACTIVE
    rotation_count: int = 0
    last_rotated: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EncryptionResult:
    """Encryption result"""
    ciphertext: str
    key_id: str
    algorithm: str
    iv: Optional[str] = None
    tag: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DecryptionResult:
    """Decryption result"""
    plaintext: str
    key_id: str
    algorithm: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class KeyManager:
    """Encryption key management"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.master_key = self._get_or_create_master_key()
        self.key_cache = {}

    def _get_or_create_master_key(self) -> bytes:
        """Get or create master encryption key"""
        master_key_key = "encryption_master_key"

        master_key = self.redis_client.get(master_key_key)
        if master_key:
            return base64.b64decode(master_key)

        # Generate new master key
        master_key = Fernet.generate_key()
        self.redis_client.set(master_key_key, base64.b64encode(master_key))

        logger.info("Generated new master encryption key")
        return master_key

    def _derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return kdf.derive(password.encode())

    def _encrypt_key_material(self, key_material: bytes) -> str:
        """Encrypt key material with master key"""
        fernet = Fernet(base64.urlsafe_b64encode(self.master_key))
        return fernet.encrypt(key_material).decode()

    def _decrypt_key_material(self, encrypted_key: str) -> bytes:
        """Decrypt key material with master key"""
        fernet = Fernet(base64.urlsafe_b64encode(self.master_key))
        return fernet.decrypt(encrypted_key.encode())

    def generate_key(self, algorithm: EncryptionAlgorithm, tenant_id: str,
                    key_size: int = 256, expires_days: int = None) -> EncryptionKey:
        """Generate new encryption key"""
        key_id = f"key_{tenant_id}_{algorithm.value}_{int(datetime.utcnow().timestamp())}"

        if algorithm == EncryptionAlgorithm.FERNET:
            key_material = Fernet.generate_key()
        elif algorithm in [EncryptionAlgorithm.AES_256_GCM, EncryptionAlgorithm.AES_256_CBC]:
            key_material = os.urandom(32)  # 256 bits
        elif algorithm in [EncryptionAlgorithm.RSA_2048, EncryptionAlgorithm.RSA_4096]:
            key_size_bits = 2048 if algorithm == EncryptionAlgorithm.RSA_2048 else 4096
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=key_size_bits
            )
            key_material = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        # Calculate key hash
        key_hash = hashlib.sha256(key_material).hexdigest()

        # Encrypt key material
        encrypted_key = self._encrypt_key_material(key_material)

        # Set expiration
        expires_at = None
        if expires_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_days)

        # Create key object
        encryption_key = EncryptionKey(
            key_id=key_id,
            algorithm=algorithm,
            key_material=encrypted_key,
            key_hash=key_hash,
            tenant_id=tenant_id,
            expires_at=expires_at
        )

        # Store key
        self._store_key(encryption_key)

        logger.info(f"Generated new encryption key: {key_id} for tenant: {tenant_id}")

        return encryption_key

    def _store_key(self, key: EncryptionKey) -> None:
        """Store encryption key"""
        key_data = {
            'key_id': key.key_id,
            'algorithm': key.algorithm.value,
            'key_material': key.key_material,
            'key_hash': key.key_hash,
            'tenant_id': key.tenant_id,
            'created_at': key.created_at.isoformat(),
            'expires_at': key.expires_at.isoformat() if key.expires_at else None,
            'status': key.status.value,
            'rotation_count': key.rotation_count,
            'last_rotated': key.last_rotated.isoformat() if key.last_rotated else None,
            'metadata': key.metadata
        }

        key_prefix = f"{ENCRYPTION_KEY_PREFIX}:{key.tenant_id}"
        key_key = f"{key_prefix}:{key.key_id}"

        # Store with appropriate TTL
        ttl = None
        if key.expires_at:
            ttl = int((key.expires_at - datetime.utcnow()).total_seconds())

        if ttl and ttl > 0:
            self.redis_client.setex(key_key, ttl, json.dumps(key_data))
        else:
            self.redis_client.set(key_key, json.dumps(key_data))

        # Update cache
        self.key_cache[key.key_id] = key

    def get_key(self, key_id: str, tenant_id: str) -> Optional[EncryptionKey]:
        """Get encryption key"""
        # Check cache first
        if key_id in self.key_cache:
            return self.key_cache[key_id]

        # Get from Redis
        key_prefix = f"{ENCRYPTION_KEY_PREFIX}:{tenant_id}"
        key_key = f"{key_prefix}:{key_id}"

        key_data = self.redis_client.get(key_key)
        if not key_data:
            return None

        key_dict = json.loads(key_data)

        key = EncryptionKey(
            key_id=key_dict['key_id'],
            algorithm=EncryptionAlgorithm(key_dict['algorithm']),
            key_material=key_dict['key_material'],
            key_hash=key_dict['key_hash'],
            tenant_id=key_dict['tenant_id'],
            created_at=datetime.fromisoformat(key_dict['created_at']),
            expires_at=datetime.fromisoformat(key_dict['expires_at']) if key_dict['expires_at'] else None,
            status=KeyStatus(key_dict['status']),
            rotation_count=key_dict['rotation_count'],
            last_rotated=datetime.fromisoformat(key_dict['last_rotated']) if key_dict['last_rotated'] else None,
            metadata=key_dict['metadata']
        )

        # Update cache
        self.key_cache[key_id] = key

        return key

    def get_active_keys(self, tenant_id: str) -> List[EncryptionKey]:
        """Get all active keys for tenant"""
        key_prefix = f"{ENCRYPTION_KEY_PREFIX}:{tenant_id}"
        keys = []

        # Get all keys for tenant
        pattern = f"{key_prefix}:*"
        redis_keys = self.redis_client.keys(pattern)

        for redis_key in redis_keys:
            key_data = self.redis_client.get(redis_key)
            if key_data:
                key_dict = json.loads(key_data)
                if key_dict['status'] == KeyStatus.ACTIVE.value:
                    key = EncryptionKey(
                        key_id=key_dict['key_id'],
                        algorithm=EncryptionAlgorithm(key_dict['algorithm']),
                        key_material=key_dict['key_material'],
                        key_hash=key_dict['key_hash'],
                        tenant_id=key_dict['tenant_id'],
                        created_at=datetime.fromisoformat(key_dict['created_at']),
                        expires_at=datetime.fromisoformat(key_dict['expires_at']) if key_dict['expires_at'] else None,
                        status=KeyStatus(key_dict['status']),
                        rotation_count=key_dict['rotation_count'],
                        last_rotated=datetime.fromisoformat(key_dict['last_rotated']) if key_dict['last_rotated'] else None,
                        metadata=key_dict['metadata']
                    )
                    keys.append(key)

        return keys

    def rotate_key(self, key_id: str, tenant_id: str) -> Optional[EncryptionKey]:
        """Rotate encryption key"""
        old_key = self.get_key(key_id, tenant_id)
        if not old_key:
            return None

        # Mark old key as rotating
        old_key.status = KeyStatus.ROTATING
        self._store_key(old_key)

        # Generate new key
        new_key = self.generate_key(old_key.algorithm, tenant_id)

        # Update old key metadata
        old_key.metadata['rotated_to'] = new_key.key_id
        old_key.metadata['rotated_at'] = datetime.utcnow().isoformat()
        old_key.last_rotated = datetime.utcnow()
        old_key.rotation_count += 1

        # Mark old key as deprecated after grace period
        old_key.status = KeyStatus.DEPRECATED
        self._store_key(old_key)

        logger.info(f"Rotated key {key_id} to {new_key.key_id} for tenant {tenant_id}")

        return new_key

    def revoke_key(self, key_id: str, tenant_id: str) -> bool:
        """Revoke encryption key"""
        key = self.get_key(key_id, tenant_id)
        if not key:
            return False

        key.status = KeyStatus.REVOKED
        key.metadata['revoked_at'] = datetime.utcnow().isoformat()
        self._store_key(key)

        # Remove from cache
        if key_id in self.key_cache:
            del self.key_cache[key_id]

        logger.info(f"Revoked key {key_id} for tenant {tenant_id}")

        return True

    def should_rotate_key(self, key: EncryptionKey) -> bool:
        """Check if key should be rotated"""
        if key.status != KeyStatus.ACTIVE:
            return False

        # Check if key is older than rotation period
        key_age = datetime.utcnow() - key.created_at
        return key_age >= timedelta(days=KEY_ROTATION_DAYS)


class DataEncryptor:
    """Data encryption and decryption"""

    def __init__(self, key_manager: KeyManager):
        self.key_manager = key_manager

    def encrypt_data(self, data: Union[str, bytes], key_id: str, tenant_id: str,
                    algorithm: EncryptionAlgorithm = None) -> EncryptionResult:
        """Encrypt data"""
        key = self.key_manager.get_key(key_id, tenant_id)
        if not key:
            raise ValueError(f"Key not found: {key_id}")

        if algorithm and algorithm != key.algorithm:
            raise ValueError("Specified algorithm does not match key algorithm")

        algorithm = key.algorithm
        key_material = self.key_manager._decrypt_key_material(key.key_material)

        if isinstance(data, str):
            data = data.encode('utf-8')

        if algorithm == EncryptionAlgorithm.FERNET:
            fernet = Fernet(base64.urlsafe_b64encode(key_material))
            ciphertext = fernet.encrypt(data)

            return EncryptionResult(
                ciphertext=ciphertext.decode(),
                key_id=key_id,
                algorithm=algorithm.value
            )

        elif algorithm == EncryptionAlgorithm.AES_256_GCM:
            iv = os.urandom(12)  # 96 bits for GCM
            cipher = Cipher(algorithms.AES(key_material), modes.GCM(iv))
            encryptor = cipher.encryptor()

            ciphertext = encryptor.update(data) + encryptor.finalize()

            return EncryptionResult(
                ciphertext=ciphertext.decode('latin-1'),
                key_id=key_id,
                algorithm=algorithm.value,
                iv=base64.b64encode(iv).decode(),
                tag=base64.b64encode(encryptor.tag).decode()
            )

        elif algorithm == EncryptionAlgorithm.AES_256_CBC:
            iv = os.urandom(16)  # 128 bits for CBC

            # Pad data to block size
            pad_len = 16 - (len(data) % 16)
            padded_data = data + bytes([pad_len] * pad_len)

            cipher = Cipher(algorithms.AES(key_material), modes.CBC(iv))
            encryptor = cipher.encryptor()

            ciphertext = encryptor.update(padded_data) + encryptor.finalize()

            return EncryptionResult(
                ciphertext=ciphertext.decode('latin-1'),
                key_id=key_id,
                algorithm=algorithm.value,
                iv=base64.b64encode(iv).decode()
            )

        else:
            raise ValueError(f"Unsupported encryption algorithm: {algorithm}")

    def decrypt_data(self, ciphertext: str, key_id: str, tenant_id: str,
                    iv: str = None, tag: str = None) -> DecryptionResult:
        """Decrypt data"""
        key = self.key_manager.get_key(key_id, tenant_id)
        if not key:
            raise ValueError(f"Key not found: {key_id}")

        if key.status != KeyStatus.ACTIVE:
            raise ValueError(f"Key is not active: {key.status}")

        key_material = self.key_manager._decrypt_key_material(key.key_material)

        algorithm = key.algorithm

        if algorithm == EncryptionAlgorithm.FERNET:
            fernet = Fernet(base64.urlsafe_b64encode(key_material))
            plaintext = fernet.decrypt(ciphertext.encode())

            return DecryptionResult(
                plaintext=plaintext.decode('utf-8'),
                key_id=key_id,
                algorithm=algorithm.value
            )

        elif algorithm == EncryptionAlgorithm.AES_256_GCM:
            if not iv or not tag:
                raise ValueError("IV and tag are required for AES-GCM decryption")

            iv_bytes = base64.b64decode(iv)
            tag_bytes = base64.b64decode(tag)
            ciphertext_bytes = ciphertext.encode('latin-1')

            cipher = Cipher(algorithms.AES(key_material), modes.GCM(iv_bytes, tag_bytes))
            decryptor = cipher.decryptor()

            plaintext = decryptor.update(ciphertext_bytes) + decryptor.finalize()

            return DecryptionResult(
                plaintext=plaintext.decode('utf-8'),
                key_id=key_id,
                algorithm=algorithm.value
            )

        elif algorithm == EncryptionAlgorithm.AES_256_CBC:
            if not iv:
                raise ValueError("IV is required for AES-CBC decryption")

            iv_bytes = base64.b64decode(iv)
            ciphertext_bytes = ciphertext.encode('latin-1')

            cipher = Cipher(algorithms.AES(key_material), modes.CBC(iv_bytes))
            decryptor = cipher.decryptor()

            padded_plaintext = decryptor.update(ciphertext_bytes) + decryptor.finalize()

            # Remove padding
            pad_len = padded_plaintext[-1]
            plaintext = padded_plaintext[:-pad_len]

            return DecryptionResult(
                plaintext=plaintext.decode('utf-8'),
                key_id=key_id,
                algorithm=algorithm.value
            )

        else:
            raise ValueError(f"Unsupported encryption algorithm: {algorithm}")

    def encrypt_field(self, data: Union[str, bytes], field_name: str, tenant_id: str,
                     algorithm: EncryptionAlgorithm = EncryptionAlgorithm.FERNET) -> Dict[str, Any]:
        """Encrypt a single field and return encrypted data structure"""
        # Get or create key for this field
        keys = self.key_manager.get_active_keys(tenant_id)
        key = None

        # Prefer key of specified algorithm
        for k in keys:
            if k.algorithm == algorithm:
                key = k
                break

        # If no key found, create one
        if not key:
            key = self.key_manager.generate_key(algorithm, tenant_id)

        # Encrypt data
        result = self.encrypt_data(data, key.key_id, tenant_id)

        return {
            'encrypted': True,
            'algorithm': result.algorithm,
            'key_id': result.key_id,
            'ciphertext': result.ciphertext,
            'iv': result.iv,
            'tag': result.tag,
            'field_name': field_name,
            'encrypted_at': datetime.utcnow().isoformat()
        }

    def decrypt_field(self, encrypted_data: Dict[str, Any], tenant_id: str) -> str:
        """Decrypt a single field from encrypted data structure"""
        if not encrypted_data.get('encrypted'):
            raise ValueError("Data is not encrypted")

        key_id = encrypted_data['key_id']
        ciphertext = encrypted_data['ciphertext']
        iv = encrypted_data.get('iv')
        tag = encrypted_data.get('tag')

        result = self.decrypt_data(ciphertext, key_id, tenant_id, iv, tag)

        return result.plaintext

    def hash_sensitive_data(self, data: Union[str, bytes], salt: str = None) -> str:
        """Hash sensitive data for comparison purposes"""
        if isinstance(data, str):
            data = data.encode('utf-8')

        if salt is None:
            salt = MASTER_KEY_SALT

        salted_data = data + salt.encode()
        return hashlib.sha256(salted_data).hexdigest()

    def verify_sensitive_data(self, data: Union[str, bytes], hash_value: str, salt: str = None) -> bool:
        """Verify sensitive data against hash"""
        computed_hash = self.hash_sensitive_data(data, salt)
        return constant_time.bytes_compare(
            computed_hash.encode('utf-8'),
            hash_value.encode('utf-8')
        )


# Request/Response models
class EncryptionRequest(BaseModel):
    """Encryption request"""
    data: str = Field(..., description="Data to encrypt")
    key_id: Optional[str] = Field(None, description="Key ID (optional, will generate if not provided)")
    algorithm: str = Field(EncryptionAlgorithm.FERNET.value, description="Encryption algorithm")

    @validator('algorithm')
    def validate_algorithm(cls, v):
        valid_algorithms = [a.value for a in EncryptionAlgorithm]
        if v not in valid_algorithms:
            raise ValueError(f"Invalid algorithm. Must be one of: {valid_algorithms}")
        return v


class DecryptionRequest(BaseModel):
    """Decryption request"""
    ciphertext: str = Field(..., description="Encrypted data")
    key_id: str = Field(..., description="Key ID")
    iv: Optional[str] = Field(None, description="Initialization vector")
    tag: Optional[str] = Field(None, description="Authentication tag")


class KeyGenerationRequest(BaseModel):
    """Key generation request"""
    algorithm: str = Field(EncryptionAlgorithm.FERNET.value, description="Encryption algorithm")
    expires_days: Optional[int] = Field(None, description="Key expiration in days")

    @validator('algorithm')
    def validate_algorithm(cls, v):
        valid_algorithms = [a.value for a in EncryptionAlgorithm]
        if v not in valid_algorithms:
            raise ValueError(f"Invalid algorithm. Must be one of: {valid_algorithms}")
        return v


class EncryptionAPI:
    """Encryption API endpoints"""

    def __init__(self, key_manager: KeyManager, data_encryptor: DataEncryptor):
        self.key_manager = key_manager
        self.data_encryptor = data_encryptor

    async def generate_key(self, request: Request, key_request: KeyGenerationRequest) -> Dict[str, Any]:
        """Generate new encryption key"""
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        algorithm = EncryptionAlgorithm(key_request.algorithm)
        key = self.key_manager.generate_key(
            algorithm, tenant_id, expires_days=key_request.expires_days
        )

        return {
            'key_id': key.key_id,
            'algorithm': key.algorithm.value,
            'tenant_id': key.tenant_id,
            'created_at': key.created_at.isoformat(),
            'expires_at': key.expires_at.isoformat() if key.expires_at else None,
            'status': key.status.value
        }

    async def encrypt_data(self, request: Request, encryption_request: EncryptionRequest) -> Dict[str, Any]:
        """Encrypt data"""
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        try:
            if encryption_request.key_id:
                result = self.data_encryptor.encrypt_data(
                    encryption_request.data,
                    encryption_request.key_id,
                    tenant_id
                )
            else:
                # Generate new key
                algorithm = EncryptionAlgorithm(encryption_request.algorithm)
                key = self.key_manager.generate_key(algorithm, tenant_id)
                result = self.data_encryptor.encrypt_data(
                    encryption_request.data,
                    key.key_id,
                    tenant_id
                )

            return {
                'ciphertext': result.ciphertext,
                'key_id': result.key_id,
                'algorithm': result.algorithm,
                'iv': result.iv,
                'tag': result.tag,
                'encrypted_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Encryption failed"
            )

    async def decrypt_data(self, request: Request, decryption_request: DecryptionRequest) -> Dict[str, Any]:
        """Decrypt data"""
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        try:
            result = self.data_encryptor.decrypt_data(
                decryption_request.ciphertext,
                decryption_request.key_id,
                tenant_id,
                decryption_request.iv,
                decryption_request.tag
            )

            return {
                'plaintext': result.plaintext,
                'key_id': result.key_id,
                'algorithm': result.algorithm,
                'decrypted_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Decryption failed"
            )

    async def get_keys(self, request: Request) -> List[Dict[str, Any]]:
        """Get all keys for tenant"""
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        keys = self.key_manager.get_active_keys(tenant_id)

        return [
            {
                'key_id': key.key_id,
                'algorithm': key.algorithm.value,
                'tenant_id': key.tenant_id,
                'created_at': key.created_at.isoformat(),
                'expires_at': key.expires_at.isoformat() if key.expires_at else None,
                'status': key.status.value,
                'rotation_count': key.rotation_count,
                'last_rotated': key.last_rotated.isoformat() if key.last_rotated else None
            }
            for key in keys
        ]

    async def rotate_key(self, request: Request, key_id: str) -> Dict[str, Any]:
        """Rotate encryption key"""
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        new_key = self.key_manager.rotate_key(key_id, tenant_id)
        if not new_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Key not found"
            )

        return {
            'old_key_id': key_id,
            'new_key_id': new_key.key_id,
            'algorithm': new_key.algorithm.value,
            'rotated_at': datetime.utcnow().isoformat()
        }

    async def revoke_key(self, request: Request, key_id: str) -> Dict[str, str]:
        """Revoke encryption key"""
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        success = self.key_manager.revoke_key(key_id, tenant_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Key not found"
            )

        return {"message": f"Key {key_id} revoked successfully"}

    async def hash_data(self, request: Request, data: str, salt: Optional[str] = None) -> Dict[str, str]:
        """Hash sensitive data"""
        hash_value = self.data_encryptor.hash_sensitive_data(data, salt)

        return {
            'hash': hash_value,
            'algorithm': 'sha256',
            'hashed_at': datetime.utcnow().isoformat()
        }

    async def verify_data(self, request: Request, data: str, hash_value: str, salt: Optional[str] = None) -> Dict[str, bool]:
        """Verify sensitive data against hash"""
        is_valid = self.data_encryptor.verify_sensitive_data(data, hash_value, salt)

        return {
            'valid': is_valid,
            'verified_at': datetime.utcnow().isoformat()
        }


# Global instances
key_manager = KeyManager(redis_client)
data_encryptor = DataEncryptor(key_manager)
encryption_api = EncryptionAPI(key_manager, data_encryptor)


if __name__ == "__main__":
    """Test encryption functionality"""
    # Test key generation
    key = key_manager.generate_key(EncryptionAlgorithm.FERNET, "test_tenant")
    print(f"Generated key: {key.key_id}")

    # Test encryption
    test_data = "Sensitive data that needs encryption"
    result = data_encryptor.encrypt_data(test_data, key.key_id, "test_tenant")
    print(f"Encrypted data: {result.ciphertext[:50]}...")

    # Test decryption
    decrypted = data_encryptor.decrypt_data(result.ciphertext, key.key_id, "test_tenant", result.iv, result.tag)
    print(f"Decrypted data: {decrypted.plaintext}")

    # Test key rotation
    new_key = key_manager.rotate_key(key.key_id, "test_tenant")
    print(f"Rotated key: {new_key.key_id}")

    # Test data hashing
    hash_value = data_encryptor.hash_sensitive_data("test password")
    print(f"Hashed password: {hash_value}")

    # Test data verification
    is_valid = data_encryptor.verify_sensitive_data("test password", hash_value)
    print(f"Password verification: {is_valid}")

    print("Encryption system test completed")