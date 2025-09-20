#!/usr/bin/env python3
"""
Fataplus Configuration Management System
Handles environment-specific configuration loading and validation
"""

import os
import sys
import yaml
from typing import Dict, Any, Optional
from pathlib import Path
from pydantic import BaseSettings, Field, validator
from enum import Enum


class Environment(str, Enum):
    """Supported deployment environments"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class DatabaseConfig(BaseSettings):
    """Database configuration"""
    host: str = "localhost"
    port: int = 5432
    database: str = "fataplus_dev"
    username: str = "fataplus_user"
    password: str = ""
    url: Optional[str] = None

    @validator('url', pre=True, always=True)
    def build_url(cls, v, values):
        if v:
            return v
        password_part = f":{values['password']}" if values['password'] else ""
        return f"postgresql://{values['username']}{password_part}@{values['host']}:{values['port']}/{values['database']}"


class RedisConfig(BaseSettings):
    """Redis configuration"""
    host: str = "localhost"
    port: int = 6379
    database: int = 0
    password: Optional[str] = None
    url: Optional[str] = None

    @validator('url', pre=True, always=True)
    def build_url(cls, v, values):
        if v:
            return v
        auth_part = f":{values['password']}@" if values['password'] else ""
        return f"redis://{auth_part}{values['host']}:{values['port']}/{values['database']}"


class SecurityConfig(BaseSettings):
    """Security configuration"""
    secret_key: str = "your-secret-key-here"
    jwt_secret_key: str = "your-jwt-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS configuration
    cors_origins: list = ["http://localhost:3000", "http://localhost:8000"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_allow_headers: list = ["*"]


class EmailConfig(BaseSettings):
    """Email configuration"""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@fata.plus"


class MonitoringConfig(BaseSettings):
    """Monitoring and logging configuration"""
    log_level: str = "INFO"
    sentry_dsn: Optional[str] = None
    posthog_api_key: Optional[str] = None

    # Prometheus/Grafana
    metrics_enabled: bool = True
    metrics_port: int = 9090

    # Health checks
    health_check_enabled: bool = True
    health_check_path: str = "/health"


class RegionalConfig(BaseSettings):
    """Regional configuration for African markets"""
    timezone: str = "Africa/Nairobi"
    default_currency: str = "USD"
    default_language: str = "en"
    supported_languages: list = ["en", "fr", "sw", "ar"]

    # Deployment regions
    deployment_regions: list = ["kenya", "south_africa", "nigeria", "ghana"]
    cdn_regions: list = ["af-south-1", "eu-west-1", "us-east-1"]


class FataplusConfig(BaseSettings):
    """Main Fataplus configuration"""

    # Environment
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = False

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4

    # Frontend Configuration
    frontend_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"

    # Sub-configurations
    database: DatabaseConfig = DatabaseConfig()
    redis: RedisConfig = RedisConfig()
    security: SecurityConfig = SecurityConfig()
    email: EmailConfig = EmailConfig()
    monitoring: MonitoringConfig = MonitoringConfig()
    regional: RegionalConfig = RegionalConfig()

    # External API Keys
    openai_api_key: Optional[str] = None
    weather_api_key: Optional[str] = None
    stripe_api_key: Optional[str] = None

    # File Storage
    minio_host: str = ""
    minio_port: int = 9000
    minio_access_key: str = ""
    minio_secret_key: str = ""
    minio_bucket_name: str = "fataplus"

    # AI Services
    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 8001
    ai_model_path: str = "/app/models"

    # MCP Configuration
    mcp_port: int = 8002

    # SSL Configuration
    ssl_cert_path: str = "/etc/ssl/certs/fataplus.crt"
    ssl_key_path: str = "/etc/ssl/private/fataplus.key"

    # LDAP Configuration
    ldap_server: str = ""
    ldap_base_dn: str = ""
    ldap_bind_dn: str = ""
    ldap_bind_password: str = ""

    # Feature Flags
    features: Dict[str, bool] = {
        "user_registration": True,
        "email_verification": True,
        "two_factor_auth": False,
        "api_rate_limiting": True,
        "caching_enabled": True,
        "audit_logging": True,
        "backup_enabled": True,
        "monitoring_enabled": True,
        "cdn_enabled": False,
        "multi_language": True,
        "mobile_money": True,
    }

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


class ConfigManager:
    """Configuration management system"""

    def __init__(self):
        self._config: Optional[FataplusConfig] = None
        self._environment: Optional[Environment] = None

    def load_environment(self) -> Environment:
        """Load environment from environment variables or file"""
        # Check for explicit environment variable
        env_str = os.getenv("FATAPLUS_ENV", os.getenv("ENVIRONMENT", "development"))

        try:
            return Environment(env_str.lower())
        except ValueError:
            print(f"Warning: Invalid environment '{env_str}', defaulting to development")
            return Environment.DEVELOPMENT

    def load_config(self, environment: Environment) -> FataplusConfig:
        """Load configuration for specified environment"""
        env_file = self._get_env_file(environment)

        # Set environment-specific env file
        os.environ["ENV_FILE"] = env_file

        # Load configuration
        config = FataplusConfig()

        # Override environment-specific settings
        config.environment = environment
        config.debug = environment == Environment.DEVELOPMENT

        # Apply environment-specific overrides
        self._apply_environment_overrides(config, environment)

        # Validate configuration
        self._validate_config(config, environment)

        return config

    def _get_env_file(self, environment: Environment) -> str:
        """Get environment file path"""
        base_dir = Path(__file__).parent.parent.parent
        return str(base_dir / f"infrastructure/docker/env-files/{environment.value}.env")

    def _apply_environment_overrides(self, config: FataplusConfig, environment: Environment):
        """Apply environment-specific configuration overrides"""
        if environment == Environment.PRODUCTION:
            # Production-specific overrides
            config.monitoring.log_level = "WARN"
            config.api_workers = 8
            config.features["debug_mode"] = False
            config.features["audit_logging"] = True
            config.features["backup_enabled"] = True

        elif environment == Environment.STAGING:
            # Staging-specific overrides
            config.monitoring.log_level = "INFO"
            config.api_workers = 4
            config.features["debug_mode"] = True
            config.features["audit_logging"] = True

        else:  # DEVELOPMENT
            # Development-specific overrides
            config.monitoring.log_level = "DEBUG"
            config.api_workers = 1
            config.features["debug_mode"] = True
            config.features["audit_logging"] = False

    def _validate_config(self, config: FataplusConfig, environment: Environment):
        """Validate configuration for the environment"""
        errors = []

        # Validate required fields for production
        if environment == Environment.PRODUCTION:
            if not config.security.secret_key or config.security.secret_key == "your-secret-key-here":
                errors.append("Production requires a real SECRET_KEY")

            if not config.security.jwt_secret_key or config.security.jwt_secret_key == "your-jwt-secret-key-here":
                errors.append("Production requires a real JWT_SECRET_KEY")

            if not config.database.password:
                errors.append("Production requires database password")

        # Validate database connectivity (basic check)
        if not config.database.host:
            errors.append("Database host is required")

        # Validate required API keys for enabled features
        if config.features["mobile_money"] and not config.stripe_api_key:
            errors.append("Stripe API key required when mobile money is enabled")

        if errors:
            error_msg = f"Configuration validation failed for {environment.value}:\n" + "\n".join(errors)
            if environment == Environment.PRODUCTION:
                raise ValueError(error_msg)
            else:
                print(f"Warning: {error_msg}")

    def get_config(self, environment: Optional[Environment] = None) -> FataplusConfig:
        """Get configuration for specified environment"""
        if environment is None:
            environment = self.load_environment()

        if self._config is None or self._environment != environment:
            self._config = self.load_config(environment)
            self._environment = environment

        return self._config

    def reload_config(self) -> FataplusConfig:
        """Reload configuration from environment"""
        self._config = None
        return self.get_config()

    def export_config(self, format: str = "yaml") -> str:
        """Export configuration in specified format"""
        config = self.get_config()

        if format.lower() == "yaml":
            return yaml.dump(config.dict(), default_flow_style=False)
        elif format.lower() == "json":
            return config.json(indent=2)
        else:
            raise ValueError(f"Unsupported format: {format}")


# Global configuration manager instance
config_manager = ConfigManager()


def get_config() -> FataplusConfig:
    """Get configuration for current environment"""
    return config_manager.get_config()


def get_environment() -> Environment:
    """Get current environment"""
    return config_manager.load_environment()


if __name__ == "__main__":
    # CLI usage
    import argparse

    parser = argparse.ArgumentParser(description="Fataplus Configuration Manager")
    parser.add_argument("--env", choices=["development", "staging", "production"],
                       help="Environment to validate")
    parser.add_argument("--export", choices=["yaml", "json"],
                       help="Export configuration format")
    parser.add_argument("--validate", action="store_true",
                       help="Validate configuration only")

    args = parser.parse_args()

    if args.env:
        environment = Environment(args.env)
    else:
        environment = config_manager.load_environment()

    try:
        config = config_manager.get_config(environment)

        if args.validate:
            print(f"✅ Configuration for {environment.value} is valid")
        elif args.export:
            print(config_manager.export_config(args.export))
        else:
            print(f"✅ Configuration loaded for {environment.value}")
            print(f"   Database: {config.database.host}:{config.database.port}/{config.database.database}")
            print(f"   Redis: {config.redis.host}:{config.redis.port}")
            print(f"   API: {config.api_host}:{config.api_port}")
            print(f"   Debug: {config.debug}")

    except Exception as e:
        print(f"❌ Configuration error: {e}")
        sys.exit(1)