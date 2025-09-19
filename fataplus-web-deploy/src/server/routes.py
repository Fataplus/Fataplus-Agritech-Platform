"""
Server Management API Routes
FastAPI routes for server monitoring, management, and administration
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
import structlog

from .server_monitor import server_monitor
from ..auth.auth_service import auth_service, User, Permission

logger = structlog.get_logger(__name__)

# Router
router = APIRouter(prefix="/server", tags=["Server Management"])

# Pydantic models
class ServiceRestartRequest(BaseModel):
    """Service restart request model"""
    service_name: str = Field(..., description="Name of the service to restart")
    reason: Optional[str] = Field(None, description="Reason for restart")

class ServerConfigUpdate(BaseModel):
    """Server configuration update model"""
    monitoring_interval: Optional[int] = Field(None, description="Monitoring interval in seconds")
    alert_thresholds: Optional[Dict[str, float]] = Field(None, description="Alert thresholds")

class BackupRequest(BaseModel):
    """Backup request model"""
    backup_type: str = Field(..., description="Type of backup (full, incremental, config)")
    include_data: bool = Field(True, description="Include data in backup")
    include_logs: bool = Field(True, description="Include logs in backup")

class LogQuery(BaseModel):
    """Log query model"""
    service: Optional[str] = Field(None, description="Service to query logs for")
    level: Optional[str] = Field(None, description="Log level filter")
    start_time: Optional[datetime] = Field(None, description="Start time for logs")
    end_time: Optional[datetime] = Field(None, description="End time for logs")
    limit: int = Field(100, description="Maximum number of log entries", ge=1, le=1000)

# Dependencies
def require_server_permission():
    """Require server management permission"""
    def permission_checker(current_user: User = Depends(auth_service.get_current_user)):
        if not current_user.has_permission(Permission.MANAGE_SERVERS):
            raise HTTPException(
                status_code=403,
                detail="Server management permission required"
            )
        return current_user
    return permission_checker

# Routes
@router.get("/status", response_model=Dict[str, Any])
async def get_server_status(current_user: User = Depends(require_server_permission())):
    """Get comprehensive server status"""
    try:
        server_info = await server_monitor.get_server_info()

        logger.info("Server status retrieved", user_id=current_user.id)

        return {
            "server": server_info,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to get server status", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get server status")

@router.get("/health", response_model=Dict[str, Any])
async def get_server_health():
    """Get server health check (public endpoint)"""
    try:
        health_report = await server_monitor.run_health_checks()

        return health_report

    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=500, detail="Health check failed")

@router.get("/metrics", response_model=Dict[str, Any])
async def get_server_metrics(current_user: User = Depends(require_server_permission())):
    """Get detailed server metrics"""
    try:
        metrics = await server_monitor.collect_system_metrics()
        services = await server_monitor.get_all_service_statuses()

        return {
            "metrics": metrics.to_dict(),
            "services": {name: status.to_dict() for name, status in services.items()},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to get server metrics", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get server metrics")

@router.get("/services", response_model=Dict[str, Any])
async def get_services_status(current_user: User = Depends(require_server_permission())):
    """Get status of all monitored services"""
    try:
        services = await server_monitor.get_all_service_statuses()

        return {
            "services": {name: status.to_dict() for name, status in services.items()},
            "total_services": len(services),
            "healthy_services": len([s for s in services.values() if s.status == "running"]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to get services status", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get services status")

@router.post("/services/{service_name}/restart", response_model=Dict[str, Any])
async def restart_service(
    service_name: str,
    request: ServiceRestartRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_server_permission())
):
    """Restart a service"""
    try:
        result = await server_monitor.restart_service(service_name)

        if result["success"]:
            # Log the restart action
            logger.info("Service restart initiated",
                       service=service_name,
                       user_id=current_user.id,
                       reason=request.reason)

            # Send notification (async)
            background_tasks.add_task(
                send_restart_notification,
                service_name,
                current_user.email,
                request.reason
            )

            return {
                "message": result["message"],
                "service": service_name,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Service restart failed",
                    service=service_name,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Service restart failed")

@router.get("/alerts", response_model=Dict[str, Any])
async def get_server_alerts(current_user: User = Depends(require_server_permission())):
    """Get current server alerts"""
    try:
        metrics = await server_monitor.collect_system_metrics()
        alerts = await server_monitor.check_alerts(metrics)

        return {
            "alerts": alerts,
            "total_alerts": len(alerts),
            "critical_alerts": len([a for a in alerts if a["type"] == "critical"]),
            "warning_alerts": len([a for a in alerts if a["type"] == "warning"]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to get server alerts", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get server alerts")

@router.get("/config", response_model=Dict[str, Any])
async def get_server_config(current_user: User = Depends(require_server_permission())):
    """Get server configuration"""
    try:
        config = {
            "monitoring_interval": server_monitor.monitoring_interval,
            "alert_thresholds": server_monitor.alert_thresholds,
            "monitored_services": list(server_monitor.monitored_services.keys()),
            "hostname": server_monitor.hostname,
            "server_id": server_monitor.server_id,
            "environment": server_monitor.environment
        }

        return {
            "config": config,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to get server config", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get server config")

@router.put("/config", response_model=Dict[str, Any])
async def update_server_config(
    config_update: ServerConfigUpdate,
    current_user: User = Depends(require_server_permission())
):
    """Update server configuration"""
    try:
        updates = {}

        if config_update.monitoring_interval is not None:
            server_monitor.monitoring_interval = config_update.monitoring_interval
            updates["monitoring_interval"] = config_update.monitoring_interval

        if config_update.alert_thresholds is not None:
            server_monitor.alert_thresholds.update(config_update.alert_thresholds)
            updates["alert_thresholds"] = config_update.alert_thresholds

        if updates:
            logger.info("Server config updated",
                       user_id=current_user.id,
                       updates=updates)

            return {
                "message": "Server configuration updated",
                "updates": updates,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            return {
                "message": "No configuration changes made",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    except Exception as e:
        logger.error("Failed to update server config", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update server config")

@router.post("/backup", response_model=Dict[str, Any])
async def create_backup(
    backup_request: BackupRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_server_permission())
):
    """Create server backup"""
    try:
        # This would implement actual backup logic
        # For now, return a placeholder response

        backup_id = f"backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

        # Start backup process (async)
        background_tasks.add_task(
            perform_backup,
            backup_id,
            backup_request.backup_type,
            backup_request.include_data,
            backup_request.include_logs,
            current_user.id
        )

        logger.info("Backup initiated",
                   backup_id=backup_id,
                   backup_type=backup_request.backup_type,
                   user_id=current_user.id)

        return {
            "message": "Backup initiated",
            "backup_id": backup_id,
            "backup_type": backup_request.backup_type,
            "status": "in_progress",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Backup creation failed", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Backup creation failed")

@router.get("/backups", response_model=Dict[str, Any])
async def list_backups(current_user: User = Depends(require_server_permission())):
    """List server backups"""
    try:
        # This would query actual backup records
        # For now, return placeholder data
        backups = [
            {
                "id": "backup_20240120_020000",
                "type": "full",
                "status": "completed",
                "size_gb": 8.5,
                "created_at": "2024-01-20T02:00:00Z",
                "created_by": "system"
            },
            {
                "id": "backup_20240119_020000",
                "type": "incremental",
                "status": "completed",
                "size_gb": 2.1,
                "created_at": "2024-01-19T02:00:00Z",
                "created_by": "admin"
            }
        ]

        return {
            "backups": backups,
            "total_backups": len(backups),
            "total_size_gb": sum(b["size_gb"] for b in backups),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to list backups", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list backups")

@router.get("/logs", response_model=Dict[str, Any])
async def get_server_logs(
    query: LogQuery = None,
    current_user: User = Depends(require_server_permission())
):
    """Get server logs"""
    try:
        if query is None:
            query = LogQuery()

        # This would implement actual log querying
        # For now, return placeholder data
        logs = [
            {
                "timestamp": "2024-01-20T14:30:00Z",
                "level": "INFO",
                "service": "web-backend",
                "message": "User login successful",
                "user_id": "user_123"
            },
            {
                "timestamp": "2024-01-20T14:25:00Z",
                "level": "WARN",
                "service": "smollm2-ai",
                "message": "High memory usage detected",
                "memory_percent": 85.2
            },
            {
                "timestamp": "2024-01-20T14:20:00Z",
                "level": "ERROR",
                "service": "database",
                "message": "Connection timeout",
                "error_code": "CONN_TIMEOUT"
            }
        ]

        # Apply filters
        if query.service:
            logs = [log for log in logs if log["service"] == query.service]
        if query.level:
            logs = [log for log in logs if log["level"] == query.level.upper()]
        if query.start_time:
            logs = [log for log in logs if log["timestamp"] >= query.start_time.isoformat()]
        if query.end_time:
            logs = [log for log in logs if log["timestamp"] <= query.end_time.isoformat()]

        # Apply limit
        logs = logs[:query.limit]

        return {
            "logs": logs,
            "total_logs": len(logs),
            "query": {
                "service": query.service,
                "level": query.level,
                "start_time": query.start_time.isoformat() if query.start_time else None,
                "end_time": query.end_time.isoformat() if query.end_time else None,
                "limit": query.limit
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to get server logs", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get server logs")

@router.get("/performance", response_model=Dict[str, Any])
async def get_performance_metrics(
    hours: int = 24,
    current_user: User = Depends(require_server_permission())
):
    """Get historical performance metrics"""
    try:
        # This would query actual performance metrics from database
        # For now, return placeholder data
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=hours)

        metrics = {
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "hours": hours
            },
            "cpu_usage": [
                {"timestamp": "2024-01-20T10:00:00Z", "value": 45.2},
                {"timestamp": "2024-01-20T11:00:00Z", "value": 52.1},
                {"timestamp": "2024-01-20T12:00:00Z", "value": 48.7},
                {"timestamp": "2024-01-20T13:00:00Z", "value": 61.3},
                {"timestamp": "2024-01-20T14:00:00Z", "value": 65.2}
            ],
            "memory_usage": [
                {"timestamp": "2024-01-20T10:00:00Z", "value": 72.3},
                {"timestamp": "2024-01-20T11:00:00Z", "value": 75.1},
                {"timestamp": "2024-01-20T12:00:00Z", "value": 78.2},
                {"timestamp": "2024-01-20T13:00:00Z", "value": 81.5},
                {"timestamp": "2024-01-20T14:00:00Z", "value": 83.7}
            ],
            "response_times": [
                {"timestamp": "2024-01-20T10:00:00Z", "value": 125},
                {"timestamp": "2024-01-20T11:00:00Z", "value": 142},
                {"timestamp": "2024-01-20T12:00:00Z", "value": 138},
                {"timestamp": "2024-01-20T13:00:00Z", "value": 156},
                {"timestamp": "2024-01-20T14:00:00Z", "value": 145}
            ],
            "api_calls": [
                {"timestamp": "2024-01-20T10:00:00Z", "value": 1200},
                {"timestamp": "2024-01-20T11:00:00Z", "value": 1350},
                {"timestamp": "2024-01-20T12:00:00Z", "value": 1180},
                {"timestamp": "2024-01-20T13:00:00Z", "value": 1420},
                {"timestamp": "2024-01-20T14:00:00Z", "value": 1380}
            ]
        }

        return metrics

    except Exception as e:
        logger.error("Failed to get performance metrics", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get performance metrics")

# Helper functions
async def send_restart_notification(service_name: str, user_email: str, reason: str):
    """Send notification about service restart"""
    try:
        # Implementation would send email notification
        logger.info("Restart notification sent",
                   service=service_name,
                   user_email=user_email,
                   reason=reason)
    except Exception as e:
        logger.error("Failed to send restart notification", error=str(e))

async def perform_backup(backup_id: str, backup_type: str, include_data: bool,
                        include_logs: bool, user_id: str):
    """Perform actual backup operation"""
    try:
        # Implementation would perform actual backup
        logger.info("Backup completed",
                   backup_id=backup_id,
                   backup_type=backup_type,
                   user_id=user_id)
    except Exception as e:
        logger.error("Backup failed",
                    backup_id=backup_id,
                    user_id=user_id,
                    error=str(e))
