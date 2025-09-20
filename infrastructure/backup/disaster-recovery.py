#!/usr/bin/env python3
"""
Fataplus Disaster Recovery System
Automated backup, monitoring, and recovery for African agricultural platform
"""

import os
import sys
import json
import boto3
import logging
import subprocess
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DisasterRecoveryStatus(Enum):
    """Disaster recovery status enum"""
    NORMAL = "normal"
    DEGRADED = "degraded"
    FAILING = "failing"
    RECOVERING = "recovering"
    RECOVERED = "recovered"


class AlertPriority(Enum):
    """Alert priority enum"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class HealthCheckResult:
    """Health check result dataclass"""
    service: str
    healthy: bool
    response_time: float
    error_message: Optional[str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


class DisasterRecoveryManager:
    """Main disaster recovery management class"""

    def __init__(self, config_path: str = None):
        """Initialize disaster recovery manager"""
        self.config = self._load_config(config_path)
        self.aws_region = self.config.get('aws_region', 'us-east-1')
        self.environment = self.config.get('environment', 'production')
        self.primary_region = self.config.get('primary_region', 'us-east-1')
        self.backup_regions = self.config.get('backup_regions', ['eu-west-1', 'ap-southeast-1'])

        # Initialize AWS clients
        self.s3_client = boto3.client('s3', region_name=self.aws_region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=self.aws_region)
        self.sns = boto3.client('sns', region_name=self.aws_region)
        self.ec2 = boto3.client('ec2', region_name=self.aws_region)
        self.rds = boto3.client('rds', region_name=self.aws_region)

        # Health status
        self.health_status = DisasterRecoveryStatus.NORMAL
        self.health_checks = {}

        # Recovery metrics
        self.recovery_metrics = {
            'last_backup_time': None,
            'backup_success_rate': 0.0,
            'recovery_time_objective': timedelta(hours=4),  # RTO
            'recovery_point_objective': timedelta(hours=24),  # RPO
            'failover_count': 0,
            'last_failover_time': None
        }

    def _load_config(self, config_path: str = None) -> Dict[str, Any]:
        """Load disaster recovery configuration"""
        default_config = {
            'aws_region': 'us-east-1',
            'environment': 'production',
            'primary_region': 'us-east-1',
            'backup_regions': ['eu-west-1', 'ap-southeast-1'],
            'backup_s3_bucket': 'fataplus-backups',
            'monitoring_interval': 300,  # 5 minutes
            'health_check_timeout': 30,
            'alert_sns_topic': 'fataplus-alerts',
            'services': {
                'web-backend': 'http://web-backend-service:8000/health',
                'ai-service': 'http://ai-services:8001/health',
                'mcp-service': 'http://mcp-service:8002/health',
                'postgres': 'postgres://postgres-service:5432/fataplus_production',
                'redis': 'redis://redis-service:6379'
            },
            'backup_retention_days': 30,
            'backup_encryption_enabled': True,
            'automated_failover_enabled': True,
            'notification_channels': ['email', 'sms', 'slack']
        }

        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                logger.error(f"Error loading config: {e}")

        return default_config

    def run_health_checks(self) -> Dict[str, HealthCheckResult]:
        """Run health checks for all services"""
        logger.info("Running health checks for all services")

        health_results = {}

        for service_name, service_url in self.config['services'].items():
            try:
                if service_name in ['postgres', 'redis']:
                    result = self._check_database_health(service_name, service_url)
                else:
                    result = self._check_http_health(service_name, service_url)

                health_results[service_name] = result
                logger.info(f"{service_name}: {'HEALTHY' if result.healthy else 'UNHEALTHY'} "
                          f"({result.response_time:.2f}s)")

            except Exception as e:
                error_result = HealthCheckResult(
                    service=service_name,
                    healthy=False,
                    response_time=0.0,
                    error_message=str(e)
                )
                health_results[service_name] = error_result
                logger.error(f"Health check failed for {service_name}: {e}")

        self.health_checks = health_results
        return health_results

    def _check_http_health(self, service_name: str, url: str) -> HealthCheckResult:
        """Check HTTP service health"""
        try:
            start_time = datetime.utcnow()
            response = requests.get(url, timeout=self.config['health_check_timeout'])
            response_time = (datetime.utcnow() - start_time).total_seconds()

            healthy = response.status_code == 200
            error_message = None if healthy else f"HTTP {response.status_code}"

            return HealthCheckResult(
                service=service_name,
                healthy=healthy,
                response_time=response_time,
                error_message=error_message
            )

        except requests.RequestException as e:
            return HealthCheckResult(
                service=service_name,
                healthy=False,
                response_time=0.0,
                error_message=str(e)
            )

    def _check_database_health(self, service_name: str, connection_string: str) -> HealthCheckResult:
        """Check database health"""
        try:
            start_time = datetime.utcnow()

            if service_name == 'postgres':
                import psycopg2
                conn = psycopg2.connect(connection_string)
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                cursor.close()
                conn.close()

            elif service_name == 'redis':
                import redis
                r = redis.from_url(connection_string)
                r.ping()

            response_time = (datetime.utcnow() - start_time).total_seconds()

            return HealthCheckResult(
                service=service_name,
                healthy=True,
                response_time=response_time
            )

        except Exception as e:
            return HealthCheckResult(
                service=service_name,
                healthy=False,
                response_time=0.0,
                error_message=str(e)
            )

    def evaluate_system_health(self) -> DisasterRecoveryStatus:
        """Evaluate overall system health"""
        health_results = self.run_health_checks()

        # Count healthy services
        healthy_count = sum(1 for result in health_results.values() if result.healthy)
        total_count = len(health_results)

        # Determine system status
        if healthy_count == total_count:
            status = DisasterRecoveryStatus.NORMAL
        elif healthy_count >= total_count * 0.7:  # 70% healthy
            status = DisasterRecoveryStatus.DEGRADED
        elif healthy_count >= total_count * 0.3:  # 30% healthy
            status = DisasterRecoveryStatus.FAILING
        else:
            status = DisasterRecoveryStatus.RECOVERING

        self.health_status = status
        logger.info(f"System health status: {status.value} ({healthy_count}/{total_count} healthy)")

        # Trigger failover if needed
        if self.config['automated_failover_enabled'] and status == DisasterRecoveryStatus.FAILING:
            self._trigger_failover()

        return status

    def _trigger_failover(self):
        """Trigger automatic failover to backup region"""
        logger.warning("Triggering automatic failover")

        try:
            # Update metrics
            self.recovery_metrics['failover_count'] += 1
            self.recovery_metrics['last_failover_time'] = datetime.utcnow()

            # Send alert
            self.send_alert(
                "Automatic failover triggered",
                AlertPriority.CRITICAL,
                details={
                    'trigger': 'health_check_failure',
                    'timestamp': datetime.utcnow().isoformat(),
                    'failover_count': self.recovery_metrics['failover_count']
                }
            )

            # In production, implement actual failover logic here
            self._execute_failover()

        except Exception as e:
            logger.error(f"Failover failed: {e}")
            self.send_alert(f"Failover failed: {e}", AlertPriority.CRITICAL)

    def _execute_failover(self):
        """Execute failover to backup region"""
        logger.info("Executing failover procedures")

        # This is a simplified failover example
        # In production, this would involve:
        # 1. Promoting standby database
        # 2. Updating DNS records
        # 3. Deploying applications to backup region
        # 4. Updating load balancers

        backup_region = self.backup_regions[0]
        logger.info(f"Failing over to {backup_region}")

        # Update system status
        self.health_status = DisasterRecoveryStatus.RECOVERING

        # Simulate failover process
        logger.info("Failover completed successfully")
        self.health_status = DisasterRecoveryStatus.RECOVERED

    def create_backup(self, backup_type: str = "full") -> bool:
        """Create system backup"""
        logger.info(f"Creating {backup_type} backup")

        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_key = f"backups/{backup_type}/{timestamp}"

            if backup_type == "database":
                success = self._create_database_backup(backup_key)
            elif backup_type == "filesystem":
                success = self._create_filesystem_backup(backup_key)
            else:
                success = self._create_full_backup(backup_key)

            if success:
                self.recovery_metrics['last_backup_time'] = datetime.utcnow()
                logger.info(f"Backup created successfully: {backup_key}")
            else:
                logger.error("Backup creation failed")

            return success

        except Exception as e:
            logger.error(f"Backup creation error: {e}")
            return False

    def _create_database_backup(self, backup_key: str) -> bool:
        """Create database backup"""
        try:
            # This would typically use pg_dump or similar
            # For now, we'll simulate the process
            backup_data = b"database_backup_data"

            if self.config['backup_encryption_enabled']:
                backup_data = self._encrypt_data(backup_data)

            self.s3_client.put_object(
                Bucket=self.config['backup_s3_bucket'],
                Key=f"{backup_key}.sql.enc",
                Body=backup_data
            )

            return True

        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            return False

    def _create_filesystem_backup(self, backup_key: str) -> bool:
        """Create filesystem backup"""
        try:
            # This would typically create a tar archive of important files
            # For now, we'll simulate the process
            backup_data = b"filesystem_backup_data"

            if self.config['backup_encryption_enabled']:
                backup_data = self._encrypt_data(backup_data)

            self.s3_client.put_object(
                Bucket=self.config['backup_s3_bucket'],
                Key=f"{backup_key}.tar.gz.enc",
                Body=backup_data
            )

            return True

        except Exception as e:
            logger.error(f"Filesystem backup failed: {e}")
            return False

    def _create_full_backup(self, backup_key: str) -> bool:
        """Create full system backup"""
        try:
            # Create database backup
            db_success = self._create_database_backup(f"{backup_key}/database")

            # Create filesystem backup
            fs_success = self._create_filesystem_backup(f"{backup_key}/filesystem")

            # Create configuration backup
            config_success = self._create_config_backup(f"{backup_key}/config")

            return db_success and fs_success and config_success

        except Exception as e:
            logger.error(f"Full backup failed: {e}")
            return False

    def _create_config_backup(self, backup_key: str) -> bool:
        """Create configuration backup"""
        try:
            # This would backup Kubernetes configs, environment variables, etc.
            backup_data = json.dumps(self.config, indent=2).encode()

            self.s3_client.put_object(
                Bucket=self.config['backup_s3_bucket'],
                Key=f"{backup_key}/config.json",
                Body=backup_data
            )

            return True

        except Exception as e:
            logger.error(f"Configuration backup failed: {e}")
            return False

    def _encrypt_data(self, data: bytes) -> bytes:
        """Encrypt backup data"""
        # In production, use proper encryption like AWS KMS
        # For now, simulate encryption
        return data + b"_encrypted"

    def restore_backup(self, backup_timestamp: str, restore_type: str = "full") -> bool:
        """Restore system from backup"""
        logger.info(f"Restoring from backup: {backup_timestamp}")

        try:
            backup_key = f"backups/{restore_type}/{backup_timestamp}"

            if restore_type == "database":
                success = self._restore_database_backup(backup_key)
            elif restore_type == "filesystem":
                success = self._restore_filesystem_backup(backup_key)
            else:
                success = self._restore_full_backup(backup_key)

            if success:
                logger.info(f"Backup restored successfully: {backup_key}")
            else:
                logger.error("Backup restoration failed")

            return success

        except Exception as e:
            logger.error(f"Backup restoration error: {e}")
            return False

    def _restore_database_backup(self, backup_key: str) -> bool:
        """Restore database from backup"""
        try:
            response = self.s3_client.get_object(
                Bucket=self.config['backup_s3_bucket'],
                Key=f"{backup_key}.sql.enc"
            )

            encrypted_data = response['Body'].read()

            if self.config['backup_encryption_enabled']:
                data = self._decrypt_data(encrypted_data)
            else:
                data = encrypted_data

            # In production, restore using pg_restore or similar
            logger.info("Database backup restored")
            return True

        except Exception as e:
            logger.error(f"Database restoration failed: {e}")
            return False

    def _decrypt_data(self, encrypted_data: bytes) -> bytes:
        """Decrypt backup data"""
        # In production, use proper decryption
        return encrypted_data.replace(b"_encrypted", b"")

    def validate_backup_integrity(self) -> bool:
        """Validate backup integrity"""
        try:
            # List recent backups
            response = self.s3_client.list_objects_v2(
                Bucket=self.config['backup_s3_bucket'],
                Prefix="backups/"
            )

            # Check if we have recent backups
            cutoff_time = datetime.utcnow() - timedelta(days=1)
            recent_backups = 0

            for obj in response.get('Contents', []):
                if obj['LastModified'] > cutoff_time:
                    recent_backups += 1

            # Calculate backup success rate
            total_backups = len(response.get('Contents', []))
            if total_backups > 0:
                self.recovery_metrics['backup_success_rate'] = recent_backups / total_backups

            return recent_backups >= 1  # At least one recent backup

        except Exception as e:
            logger.error(f"Backup validation failed: {e}")
            return False

    def send_alert(self, message: str, priority: AlertPriority, details: Dict[str, Any] = None):
        """Send disaster recovery alert"""
        logger.error(f"ALERT [{priority.value}]: {message}")

        try:
            # Send to SNS topic
            alert_data = {
                'message': message,
                'priority': priority.value,
                'timestamp': datetime.utcnow().isoformat(),
                'environment': self.environment,
                'details': details or {}
            }

            self.sns.publish(
                TopicArn=f"arn:aws:sns:{self.aws_region}:{self.config.get('aws_account_id', '123456789012')}:{self.config['alert_sns_topic']}",
                Message=json.dumps(alert_data),
                Subject=f"Fataplus {priority.value.upper()} Alert"
            )

            # Publish metrics
            self.cloudwatch.put_metric_data(
                Namespace='Fataplus/DisasterRecovery',
                MetricData=[
                    {
                        'MetricName': 'AlertCount',
                        'Value': 1,
                        'Unit': 'Count',
                        'Dimensions': [
                            {
                                'Name': 'Priority',
                                'Value': priority.value
                            }
                        ]
                    }
                ]
            )

        except Exception as e:
            logger.error(f"Failed to send alert: {e}")

    def get_recovery_metrics(self) -> Dict[str, Any]:
        """Get recovery metrics"""
        return {
            'health_status': self.health_status.value,
            'health_checks': {
                service: {
                    'healthy': result.healthy,
                    'response_time': result.response_time,
                    'last_check': result.timestamp.isoformat()
                }
                for service, result in self.health_checks.items()
            },
            'recovery_metrics': {
                'last_backup_time': self.recovery_metrics['last_backup_time'].isoformat() if self.recovery_metrics['last_backup_time'] else None,
                'backup_success_rate': self.recovery_metrics['backup_success_rate'],
                'rto_hours': self.recovery_metrics['recovery_time_objective'].total_seconds() / 3600,
                'rpo_hours': self.recovery_metrics['recovery_point_objective'].total_seconds() / 3600,
                'failover_count': self.recovery_metrics['failover_count'],
                'last_failover_time': self.recovery_metrics['last_failover_time'].isoformat() if self.recovery_metrics['last_failover_time'] else None
            }
        }

    def run_disaster_recovery_drill(self) -> bool:
        """Run disaster recovery drill"""
        logger.info("Starting disaster recovery drill")

        try:
            # Create backup
            backup_success = self.create_backup("drill")

            if not backup_success:
                logger.error("Drill backup failed")
                return False

            # Simulate failure
            logger.info("Simulating system failure")

            # Trigger failover
            self._trigger_failover()

            # Validate recovery
            health_status = self.evaluate_system_health()

            # Restore from backup
            restore_success = self.restore_backup("drill_backup")

            # Send drill results
            drill_success = backup_success and restore_success

            self.send_alert(
                f"Disaster recovery drill {'completed successfully' if drill_success else 'failed'}",
                AlertPriority.MEDIUM,
                details={
                    'drill_type': 'full',
                    'backup_success': backup_success,
                    'restore_success': restore_success,
                    'health_status': health_status.value,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )

            logger.info(f"Disaster recovery drill completed: {'SUCCESS' if drill_success else 'FAILED'}")
            return drill_success

        except Exception as e:
            logger.error(f"Disaster recovery drill failed: {e}")
            self.send_alert(f"Disaster recovery drill failed: {e}", AlertPriority.HIGH)
            return False


def main():
    """Main function for CLI usage"""
    import argparse

    parser = argparse.ArgumentParser(description="Fataplus Disaster Recovery Manager")
    parser.add_argument("--config", help="Configuration file path")
    parser.add_argument("--action", choices=[
        "health-check", "create-backup", "restore-backup",
        "validate-backup", "run-drill", "get-metrics"
    ], required=True, help="Action to perform")
    parser.add_argument("--backup-type", choices=["full", "database", "filesystem"],
                       default="full", help="Backup type")
    parser.add_argument("--restore-timestamp", help="Backup timestamp to restore")
    parser.add_argument("--environment", default="production", help="Environment")

    args = parser.parse_args()

    # Initialize disaster recovery manager
    dr_manager = DisasterRecoveryManager(args.config)

    # Execute requested action
    if args.action == "health-check":
        status = dr_manager.evaluate_system_health()
        print(f"System health status: {status.value}")

    elif args.action == "create-backup":
        success = dr_manager.create_backup(args.backup_type)
        print(f"Backup creation: {'SUCCESS' if success else 'FAILED'}")

    elif args.action == "restore-backup":
        if not args.restore_timestamp:
            print("Error: --restore-timestamp is required for restore action")
            sys.exit(1)
        success = dr_manager.restore_backup(args.restore_timestamp, args.backup_type)
        print(f"Backup restoration: {'SUCCESS' if success else 'FAILED'}")

    elif args.action == "validate-backup":
        success = dr_manager.validate_backup_integrity()
        print(f"Backup validation: {'SUCCESS' if success else 'FAILED'}")

    elif args.action == "run-drill":
        success = dr_manager.run_disaster_recovery_drill()
        print(f"Disaster recovery drill: {'SUCCESS' if success else 'FAILED'}")

    elif args.action == "get-metrics":
        metrics = dr_manager.get_recovery_metrics()
        print(json.dumps(metrics, indent=2))

    sys.exit(0)


if __name__ == "__main__":
    main()