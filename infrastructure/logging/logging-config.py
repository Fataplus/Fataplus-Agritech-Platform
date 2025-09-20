#!/usr/bin/env python3
"""
Fataplus Logging Configuration
Centralized logging setup for all services with regional support
"""

import os
import sys
import json
import logging
import logging.config
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from pythonjsonlogger import jsonlogger

# Regional configuration
REGIONS = ['kenya', 'south_africa', 'nigeria', 'ghana']
TIMEZONES = {
    'kenya': 'Africa/Nairobi',
    'south_africa': 'Africa/Johannesburg',
    'nigeria': 'Africa/Lagos',
    'ghana': 'Africa/Accra'
}

# Log levels
LOG_LEVELS = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL
}


class RegionalFormatter(logging.Formatter):
    """Custom formatter with regional timestamp support"""

    def __init__(self, region: str = 'kenya'):
        self.region = region
        self.timezone = TIMEZONES.get(region, 'Africa/Nairobi')
        super().__init__()

    def formatTime(self, record, datefmt=None):
        """Format time with regional timezone"""
        import pytz
        from datetime import datetime

        # Create timezone-aware datetime
        utc_time = datetime.fromtimestamp(record.created, pytz.UTC)
        regional_time = utc_time.astimezone(pytz.timezone(self.timezone))

        if datefmt:
            return regional_time.strftime(datefmt)
        else:
            return regional_time.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3] + ' ' + regional_time.tzname()

    def format(self, record):
        """Format log record with regional information"""
        # Add regional information
        record.region = self.region
        record.timezone = self.timezone

        # Add service information
        record.service_name = getattr(record, 'service_name', 'unknown')
        record.environment = getattr(record, 'environment', 'development')
        record.version = getattr(record, 'version', '1.0.0')

        # Add request correlation ID if available
        record.correlation_id = getattr(record, 'correlation_id', None)
        record.user_id = getattr(record, 'user_id', None)
        record.session_id = getattr(record, 'session_id', None)

        return super().format(record)


class JsonFormatter(jsonlogger.JsonFormatter):
    """JSON formatter for structured logging"""

    def __init__(self, region: str = 'kenya'):
        self.region = region
        self.timezone = TIMEZONES.get(region, 'Africa/Nairobi')

        # Define JSON fields
        super().__init__(
            fmt='%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d %(funcName)s',
            datefmt='%Y-%m-%d %H:%M:%S.%f%z'
        )

    def format(self, record):
        """Format log record as JSON"""
        # Create base log entry
        log_entry = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'region': self.region,
            'timezone': self.timezone,
            'service_name': getattr(record, 'service_name', 'unknown'),
            'environment': getattr(record, 'environment', 'development'),
            'version': getattr(record, 'version', '1.0.0'),
            'file': {
                'path': record.pathname,
                'line': record.lineno,
                'function': record.funcName
            }
        }

        # Add optional fields
        if hasattr(record, 'correlation_id') and record.correlation_id:
            log_entry['correlation_id'] = record.correlation_id

        if hasattr(record, 'user_id') and record.user_id:
            log_entry['user_id'] = record.user_id

        if hasattr(record, 'session_id') and record.session_id:
            log_entry['session_id'] = record.session_id

        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': self.formatException(record.exc_info)
            }

        # Add stack trace if present
        if record.stack_info:
            log_entry['stack_trace'] = record.stack_info

        return json.dumps(log_entry, default=str)

    def formatTime(self, record, datefmt=None):
        """Format time with regional timezone"""
        import pytz
        from datetime import datetime

        # Create timezone-aware datetime
        utc_time = datetime.fromtimestamp(record.created, pytz.UTC)
        regional_time = utc_time.astimezone(pytz.timezone(self.timezone))

        return regional_time.isoformat()


class FataplusLogger:
    """Main logging class for Fataplus services"""

    def __init__(self, service_name: str, region: str = 'kenya', environment: str = 'development'):
        self.service_name = service_name
        self.region = region
        self.environment = environment
        self.logger = logging.getLogger(service_name)
        self.loggers = {}

    def setup_logging(self, level: str = 'INFO', output_format: str = 'json') -> None:
        """Setup logging configuration"""
        log_level = LOG_LEVELS.get(level.upper(), logging.INFO)
        self.logger.setLevel(log_level)

        # Remove existing handlers
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)

        # Create formatters
        if output_format.lower() == 'json':
            formatter = JsonFormatter(self.region)
        else:
            formatter = RegionalFormatter(self.region)
            formatter_format = (
                f'%(asctime)s [{self.region}] %(levelname)s '
                f'%(service_name)s [%(environment)s] '
                f'%(name)s:%(lineno)d - %(message)s'
            )
            formatter = logging.Formatter(formatter_format, datefmt='%Y-%m-%d %H:%M:%S')

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

        # File handler with rotation
        log_dir = Path('logs')
        log_dir.mkdir(exist_ok=True)

        log_file = log_dir / f'{self.service_name}.log'
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)

        # Error file handler
        error_log_file = log_dir / f'{self.service_name}-error.log'
        error_handler = RotatingFileHandler(
            error_log_file,
            maxBytes=5*1024*1024,  # 5MB
            backupCount=3
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        self.logger.addHandler(error_handler)

        # Set up regional loggers
        for region in REGIONS:
            regional_logger = logging.getLogger(f'{self.service_name}.{region}')
            regional_logger.setLevel(log_level)

            # Regional file handler
            regional_log_file = log_dir / f'{self.service_name}-{region}.log'
            regional_handler = TimedRotatingFileHandler(
                regional_log_file,
                when='midnight',
                interval=1,
                backupCount=30
            )
            regional_handler.setLevel(log_level)
            regional_handler.setFormatter(JsonFormatter(region))
            regional_logger.addHandler(regional_handler)

            self.loggers[region] = regional_logger

        # Prevent propagation to root logger
        self.logger.propagate = False

    def log_with_context(self, level: str, message: str, **context) -> None:
        """Log message with additional context"""
        log_method = getattr(self.logger, level.lower(), self.logger.info)

        # Add context to log record
        extra = {
            'service_name': self.service_name,
            'environment': self.environment,
            'region': self.region,
            **context
        }

        log_method(message, extra=extra)

    def log_regional(self, region: str, level: str, message: str, **context) -> None:
        """Log message to regional logger"""
        if region in self.loggers:
            log_method = getattr(self.loggers[region], level.lower(), self.loggers[region].info)

            extra = {
                'service_name': self.service_name,
                'environment': self.environment,
                'region': region,
                **context
            }

            log_method(message, extra=extra)

    def audit_log(self, action: str, resource: str, user_id: str, **context) -> None:
        """Log security/audit events"""
        audit_message = f"AUDIT: {action} on {resource} by user {user_id}"
        self.log_with_context('INFO', audit_message,
                            audit_action=action,
                            audit_resource=resource,
                            audit_user_id=user_id,
                            **context)

    def performance_log(self, operation: str, duration: float, **context) -> None:
        """Log performance metrics"""
        perf_message = f"PERF: {operation} completed in {duration:.2f}s"
        self.log_with_context('INFO', perf_message,
                            perf_operation=operation,
                            perf_duration=duration,
                            **context)

    def business_log(self, event: str, user_id: Optional[str] = None, **context) -> None:
        """Log business events"""
        biz_message = f"BIZ: {event}"
        if user_id:
            biz_message += f" by user {user_id}"

        self.log_with_context('INFO', biz_message,
                            biz_event=event,
                            biz_user_id=user_id,
                            **context)

    def error_log(self, error: Exception, context: Dict[str, Any] = None) -> None:
        """Log errors with full context"""
        error_message = f"ERROR: {type(error).__name__}: {str(error)}"

        extra_context = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'error_traceback': traceback.format_exc()
        }

        if context:
            extra_context.update(context)

        self.log_with_context('ERROR', error_message, **extra_context)

    def debug(self, message: str, **context) -> None:
        """Debug level logging"""
        self.log_with_context('DEBUG', message, **context)

    def info(self, message: str, **context) -> None:
        """Info level logging"""
        self.log_with_context('INFO', message, **context)

    def warning(self, message: str, **context) -> None:
        """Warning level logging"""
        self.log_with_context('WARNING', message, **context)

    def error(self, message: str, **context) -> None:
        """Error level logging"""
        self.log_with_context('ERROR', message, **context)

    def critical(self, message: str, **context) -> None:
        """Critical level logging"""
        self.log_with_context('CRITICAL', message, **context)


# Global logger instances
loggers = {}


def get_logger(service_name: str, region: str = 'kenya', environment: str = 'development') -> FataplusLogger:
    """Get or create logger instance"""
    cache_key = f"{service_name}:{region}:{environment}"

    if cache_key not in loggers:
        loggers[cache_key] = FataplusLogger(service_name, region, environment)
        loggers[cache_key].setup_logging()

    return loggers[cache_key]


def setup_logging_config(config_path: str = None) -> None:
    """Setup logging from configuration file"""
    if config_path and Path(config_path).exists():
        with open(config_path, 'r') as f:
            config = json.load(f)

        for service_config in config.get('services', []):
            logger = get_logger(
                service_name=service_config['name'],
                region=service_config.get('region', 'kenya'),
                environment=service_config.get('environment', 'development')
            )
            logger.setup_logging(
                level=service_config.get('level', 'INFO'),
                output_format=service_config.get('format', 'json')
            )


# Default configuration
DEFAULT_LOGGING_CONFIG = {
    "services": [
        {
            "name": "web-backend",
            "region": "kenya",
            "environment": "production",
            "level": "INFO",
            "format": "json"
        },
        {
            "name": "ai-service",
            "region": "kenya",
            "environment": "production",
            "level": "INFO",
            "format": "json"
        },
        {
            "name": "mcp-service",
            "region": "kenya",
            "environment": "production",
            "level": "INFO",
            "format": "json"
        }
    ]
}


if __name__ == "__main__":
    """CLI interface for logging setup"""
    import argparse

    parser = argparse.ArgumentParser(description="Fataplus Logging Setup")
    parser.add_argument("--service", required=True, help="Service name")
    parser.add_argument("--region", default="kenya", help="Region code")
    parser.add_argument("--environment", default="development", help="Environment")
    parser.add_argument("--level", default="INFO", help="Log level")
    parser.add_argument("--format", default="json", choices=["json", "text"], help="Output format")
    parser.add_argument("--config", help="Configuration file path")

    args = parser.parse_args()

    # Setup logging
    if args.config:
        setup_logging_config(args.config)
    else:
        logger = get_logger(args.service, args.region, args.environment)
        logger.setup_logging(args.level, args.format)

        # Test logging
        logger.info("Logging setup completed successfully",
                   service=args.service,
                   region=args.region,
                   environment=args.environment)