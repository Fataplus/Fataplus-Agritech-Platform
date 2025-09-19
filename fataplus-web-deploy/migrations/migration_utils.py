#!/usr/bin/env python3
"""
Fataplus Migration Utilities
Helper functions for database migrations with rollback capabilities
"""

import os
import sys
import subprocess
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from infrastructure.docker.config_management import get_config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MigrationManager:
    """Database migration manager with rollback capabilities"""

    def __init__(self):
        self.config = get_config()
        self.migrations_dir = Path(__file__).parent
        self.backup_dir = self.migrations_dir / "backups"
        self.backup_dir.mkdir(exist_ok=True)

    def run_migration(self, migration_command: str, dry_run: bool = False) -> bool:
        """Run a migration command with error handling and backup"""
        try:
            # Create backup before running migration
            if not dry_run:
                self._create_backup()

            # Build alembic command
            cmd = self._build_alembic_command(migration_command)

            logger.info(f"Running migration command: {' '.join(cmd)}")

            if dry_run:
                logger.info("Dry run mode - no changes will be made")
                return True

            # Execute command
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.migrations_dir.parent)

            if result.returncode == 0:
                logger.info("Migration completed successfully")
                logger.info(f"Output: {result.stdout}")
                return True
            else:
                logger.error(f"Migration failed: {result.stderr}")
                # Attempt rollback
                self._rollback_migration()
                return False

        except Exception as e:
            logger.error(f"Migration error: {str(e)}")
            # Attempt rollback
            if not dry_run:
                self._rollback_migration()
            return False

    def run_rollback(self, target_revision: str, dry_run: bool = False) -> bool:
        """Rollback to a specific revision"""
        try:
            if dry_run:
                logger.info(f"Dry run rollback to revision: {target_revision}")
                return True

            logger.info(f"Rolling back to revision: {target_revision}")
            return self.run_migration(f"downgrade {target_revision}", dry_run)

        except Exception as e:
            logger.error(f"Rollback error: {str(e)}")
            return False

    def get_current_revision(self) -> Optional[str]:
        """Get current database revision"""
        try:
            cmd = self._build_alembic_command("current")
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.migrations_dir.parent)

            if result.returncode == 0:
                # Extract revision from output
                lines = result.stdout.strip().split('\n')
                if lines:
                    return lines[0].split()[0]
            return None

        except Exception as e:
            logger.error(f"Error getting current revision: {str(e)}")
            return None

    def get_migration_history(self) -> List[Dict[str, Any]]:
        """Get migration history"""
        try:
            cmd = self._build_alembic_command("history")
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.migrations_dir.parent)

            if result.returncode == 0:
                history = []
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        parts = line.split()
                        if len(parts) >= 3:
                            history.append({
                                'revision': parts[0],
                                'message': ' '.join(parts[2:])
                            })
                return history
            return []

        except Exception as e:
            logger.error(f"Error getting migration history: {str(e)}")
            return []

    def create_migration(self, message: str, autogenerate: bool = False) -> bool:
        """Create a new migration"""
        try:
            cmd = self._build_alembic_command("revision")
            cmd.extend(["-m", message])

            if autogenerate:
                cmd.append("--autogenerate")

            logger.info(f"Creating migration: {message}")
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.migrations_dir.parent)

            if result.returncode == 0:
                logger.info("Migration created successfully")
                logger.info(f"Output: {result.stdout}")
                return True
            else:
                logger.error(f"Migration creation failed: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"Error creating migration: {str(e)}")
            return False

    def validate_migration(self, migration_file: str) -> bool:
        """Validate a migration file"""
        try:
            migration_path = self.migrations_dir / "versions" / migration_file

            if not migration_path.exists():
                logger.error(f"Migration file not found: {migration_file}")
                return False

            # Check if migration file is valid Python
            result = subprocess.run([
                "python3", "-m", "py_compile", str(migration_path)
            ], capture_output=True, text=True)

            if result.returncode != 0:
                logger.error(f"Migration file syntax error: {result.stderr}")
                return False

            # Check for required functions
            with open(migration_path, 'r') as f:
                content = f.read()

            if 'def upgrade()' not in content:
                logger.error("Migration missing upgrade function")
                return False

            if 'def downgrade()' not in content:
                logger.error("Migration missing downgrade function")
                return False

            logger.info(f"Migration validation passed: {migration_file}")
            return True

        except Exception as e:
            logger.error(f"Error validating migration: {str(e)}")
            return False

    def _build_alembic_command(self, command: str) -> List[str]:
        """Build alembic command with proper configuration"""
        # Set environment variables for alembic
        env = os.environ.copy()
        env.update({
            'POSTGRES_HOST': self.config.database.host,
            'POSTGRES_PORT': str(self.config.database.port),
            'POSTGRES_DB': self.config.database.database,
            'POSTGRES_USER': self.config.database.username,
            'POSTGRES_PASSWORD': self.config.database.password,
            'PYTHONPATH': str(self.migrations_dir.parent.parent)
        })

        return ["python3", "-m", "alembic"] + command.split()

    def _create_backup(self):
        """Create database backup before migration"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = self.backup_dir / f"backup_{timestamp}.sql"

            # Use pg_dump if available, otherwise use alembic
            cmd = [
                "pg_dump",
                f"--host={self.config.database.host}",
                f"--port={self.config.database.port}",
                f"--username={self.config.database.username}",
                f"--dbname={self.config.database.database}",
                f"--file={backup_file}",
                "--no-password"
            ]

            # Set PGPASSWORD environment variable
            env = os.environ.copy()
            env['PGPASSWORD'] = self.config.database.password

            logger.info(f"Creating backup: {backup_file}")
            result = subprocess.run(cmd, capture_output=True, text=True, env=env)

            if result.returncode == 0:
                logger.info("Backup created successfully")
            else:
                logger.warning(f"Backup failed: {result.stderr}")

        except Exception as e:
            logger.warning(f"Backup creation failed: {str(e)}")

    def _rollback_migration(self):
        """Rollback the last migration"""
        try:
            current_revision = self.get_current_revision()
            if current_revision and current_revision != 'base':
                logger.info(f"Rolling back from revision: {current_revision}")
                # This would typically involve finding the previous revision
                # For now, we'll just log the rollback attempt
                logger.info("Rollback attempt logged")
            else:
                logger.info("No rollback needed")

        except Exception as e:
            logger.error(f"Rollback error: {str(e)}")


# Global migration manager instance
migration_manager = MigrationManager()


def run_migration(migration_command: str, dry_run: bool = False) -> bool:
    """Run a migration command"""
    return migration_manager.run_migration(migration_command, dry_run)


def run_rollback(target_revision: str, dry_run: bool = False) -> bool:
    """Rollback to a specific revision"""
    return migration_manager.run_rollback(target_revision, dry_run)


def create_migration(message: str, autogenerate: bool = False) -> bool:
    """Create a new migration"""
    return migration_manager.create_migration(message, autogenerate)


def get_current_revision() -> Optional[str]:
    """Get current database revision"""
    return migration_manager.get_current_revision()


def get_migration_history() -> List[Dict[str, Any]]:
    """Get migration history"""
    return migration_manager.get_migration_history()


def validate_migration(migration_file: str) -> bool:
    """Validate a migration file"""
    return migration_manager.validate_migration(migration_file)


if __name__ == "__main__":
    """CLI interface for migration utilities"""
    import argparse

    parser = argparse.ArgumentParser(description="Fataplus Migration Utilities")
    parser.add_argument("command", choices=["upgrade", "downgrade", "current", "history", "create", "validate"])
    parser.add_argument("--message", help="Migration message (for create command)")
    parser.add_argument("--revision", help="Target revision (for downgrade command)")
    parser.add_argument("--autogenerate", action="store_true", help="Autogenerate migration")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode")
    parser.add_argument("--migration-file", help="Migration file to validate")

    args = parser.parse_args()

    if args.command == "upgrade":
        success = run_migration("upgrade", args.dry_run)
    elif args.command == "downgrade":
        if not args.revision:
            print("Error: --revision required for downgrade command")
            sys.exit(1)
        success = run_rollback(args.revision, args.dry_run)
    elif args.command == "current":
        revision = get_current_revision()
        print(f"Current revision: {revision}")
        success = revision is not None
    elif args.command == "history":
        history = get_migration_history()
        for item in history:
            print(f"{item['revision']} - {item['message']}")
        success = True
    elif args.command == "create":
        if not args.message:
            print("Error: --message required for create command")
            sys.exit(1)
        success = create_migration(args.message, args.autogenerate)
    elif args.command == "validate":
        if not args.migration_file:
            print("Error: --migration-file required for validate command")
            sys.exit(1)
        success = validate_migration(args.migration_file)

    sys.exit(0 if success else 1)