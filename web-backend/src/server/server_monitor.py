"""
Fataplus Server Monitoring and Management Service
Comprehensive server monitoring, health checks, and management capabilities
"""

import os
import psutil
import socket
import subprocess
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
import json
import asyncio
import aiohttp
import structlog

logger = structlog.get_logger(__name__)


class ServerMetrics:
    """Server metrics data structure"""

    def __init__(self):
        self.cpu_percent = 0.0
        self.memory_percent = 0.0
        self.memory_used_gb = 0.0
        self.memory_total_gb = 0.0
        self.disk_used_gb = 0.0
        self.disk_total_gb = 0.0
        self.disk_percent = 0.0
        self.network_in_mbps = 0.0
        self.network_out_mbps = 0.0
        self.load_average = [0.0, 0.0, 0.0]
        self.uptime_seconds = 0
        self.process_count = 0
        self.timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary"""
        return {
            "cpu_percent": self.cpu_percent,
            "memory_percent": self.memory_percent,
            "memory_used_gb": self.memory_used_gb,
            "memory_total_gb": self.memory_total_gb,
            "disk_used_gb": self.disk_used_gb,
            "disk_total_gb": self.disk_total_gb,
            "disk_percent": self.disk_percent,
            "network_in_mbps": self.network_in_mbps,
            "network_out_mbps": self.network_out_mbps,
            "load_average": self.load_average,
            "uptime_seconds": self.uptime_seconds,
            "process_count": self.process_count,
            "timestamp": self.timestamp.isoformat()
        }


class ServiceStatus:
    """Service status data structure"""

    def __init__(self, name: str, status: str = "unknown"):
        self.name = name
        self.status = status  # running, stopped, error, degraded
        self.pid: Optional[int] = None
        self.memory_mb: Optional[float] = None
        self.cpu_percent: Optional[float] = None
        self.uptime_seconds: Optional[int] = None
        self.version: Optional[str] = None
        self.health_checks: Dict[str, Any] = {}
        self.last_check = datetime.now(timezone.utc)
        self.error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert service status to dictionary"""
        return {
            "name": self.name,
            "status": self.status,
            "pid": self.pid,
            "memory_mb": self.memory_mb,
            "cpu_percent": self.cpu_percent,
            "uptime_seconds": self.uptime_seconds,
            "version": self.version,
            "health_checks": self.health_checks,
            "last_check": self.last_check.isoformat(),
            "error_message": self.error_message
        }


class ServerMonitor:
    """Server monitoring and management service"""

    def __init__(self):
        self.hostname = socket.gethostname()
        self.server_id = os.getenv("SERVER_ID", f"server_{self.hostname}")
        self.environment = os.getenv("ENVIRONMENT", "development")

        # Services to monitor
        self.monitored_services = {
            "web-backend": {"port": 8000, "health_endpoint": "/health"},
            "smollm2-ai": {"port": 8002, "health_endpoint": "/health"},
            "admin-dashboard": {"port": 3002, "health_endpoint": "/api/health"},
            "postgres": {"port": 5432, "type": "database"},
            "redis": {"port": 6379, "type": "cache"},
            "nginx": {"port": 80, "type": "proxy"}
        }

        # Monitoring configuration
        self.monitoring_interval = int(os.getenv("MONITORING_INTERVAL", "30"))  # seconds
        self.alert_thresholds = {
            "cpu_percent": 80.0,
            "memory_percent": 85.0,
            "disk_percent": 90.0
        }

        # Previous network stats for calculating rates
        self.prev_net_stats = psutil.net_io_counters()

        logger.info("Server monitor initialized",
                   server_id=self.server_id,
                   hostname=self.hostname,
                   environment=self.environment)

    async def collect_system_metrics(self) -> ServerMetrics:
        """Collect comprehensive system metrics"""
        try:
            metrics = ServerMetrics()

            # CPU metrics
            metrics.cpu_percent = psutil.cpu_percent(interval=1)
            metrics.load_average = list(os.getloadavg()) if hasattr(os, 'getloadavg') else [0.0, 0.0, 0.0]

            # Memory metrics
            memory = psutil.virtual_memory()
            metrics.memory_percent = memory.percent
            metrics.memory_used_gb = memory.used / (1024**3)
            metrics.memory_total_gb = memory.total / (1024**3)

            # Disk metrics
            disk = psutil.disk_usage('/')
            metrics.disk_used_gb = disk.used / (1024**3)
            metrics.disk_total_gb = disk.total / (1024**3)
            metrics.disk_percent = disk.percent

            # Network metrics (calculate rates)
            current_net_stats = psutil.net_io_counters()
            time_diff = 1.0  # 1 second interval

            if hasattr(current_net_stats, 'bytes_sent') and hasattr(current_net_stats, 'bytes_recv'):
                bytes_sent_diff = current_net_stats.bytes_sent - self.prev_net_stats.bytes_sent
                bytes_recv_diff = current_net_stats.bytes_recv - self.prev_net_stats.bytes_recv

                metrics.network_out_mbps = (bytes_sent_diff * 8) / (time_diff * 1024 * 1024)  # Mbps
                metrics.network_in_mbps = (bytes_recv_diff * 8) / (time_diff * 1024 * 1024)   # Mbps

            self.prev_net_stats = current_net_stats

            # System uptime
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.readline().split()[0])
                metrics.uptime_seconds = int(uptime_seconds)

            # Process count
            metrics.process_count = len(psutil.pids())

            logger.debug("System metrics collected",
                        cpu_percent=metrics.cpu_percent,
                        memory_percent=metrics.memory_percent,
                        disk_percent=metrics.disk_percent)

            return metrics

        except Exception as e:
            logger.error("Failed to collect system metrics", error=str(e))
            return ServerMetrics()

    async def check_service_health(self, service_name: str, config: Dict[str, Any]) -> ServiceStatus:
        """Check health of a specific service"""
        status = ServiceStatus(service_name)

        try:
            service_type = config.get("type", "api")

            if service_type == "database":
                # Check database connectivity
                status.status = await self._check_database_health(service_name, config)
            elif service_type == "cache":
                # Check cache connectivity
                status.status = await self._check_cache_health(service_name, config)
            elif service_type == "proxy":
                # Check proxy service
                status.status = await self._check_proxy_health(service_name, config)
            else:
                # Check API service
                status.status = await self._check_api_health(service_name, config)

            # Get process information if service is running
            if status.status == "running":
                await self._get_process_info(status, service_name)

        except Exception as e:
            status.status = "error"
            status.error_message = str(e)
            logger.error("Service health check failed",
                        service=service_name,
                        error=str(e))

        status.last_check = datetime.now(timezone.utc)
        return status

    async def _check_api_health(self, service_name: str, config: Dict[str, Any]) -> str:
        """Check API service health"""
        port = config.get("port", 8000)
        health_endpoint = config.get("health_endpoint", "/health")

        try:
            async with aiohttp.ClientSession() as session:
                url = f"http://localhost:{port}{health_endpoint}"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("status", "healthy").lower()
                    else:
                        return "unhealthy"
        except Exception:
            return "unreachable"

    async def _check_database_health(self, service_name: str, config: Dict[str, Any]) -> str:
        """Check database health"""
        try:
            # This would implement actual database connectivity check
            # For now, return healthy if no specific error
            return "running"
        except Exception:
            return "error"

    async def _check_cache_health(self, service_name: str, config: Dict[str, Any]) -> str:
        """Check cache service health"""
        try:
            # This would implement actual cache connectivity check
            # For now, return healthy if no specific error
            return "running"
        except Exception:
            return "error"

    async def _check_proxy_health(self, service_name: str, config: Dict[str, Any]) -> str:
        """Check proxy service health"""
        try:
            # Check if nginx is running
            result = subprocess.run(
                ["systemctl", "is-active", "nginx"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0 and result.stdout.strip() == "active":
                return "running"
            else:
                return "stopped"
        except Exception:
            return "error"

    async def _get_process_info(self, status: ServiceStatus, service_name: str):
        """Get process information for running service"""
        try:
            # Find process by name or port
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'create_time']):
                try:
                    if service_name.lower() in proc.info['name'].lower():
                        status.pid = proc.info['pid']
                        status.cpu_percent = proc.info['cpu_percent']
                        status.memory_mb = proc.info['memory_info'].rss / (1024 * 1024)  # MB

                        # Calculate uptime
                        create_time = datetime.fromtimestamp(proc.info['create_time'], timezone.utc)
                        uptime = datetime.now(timezone.utc) - create_time
                        status.uptime_seconds = int(uptime.total_seconds())

                        break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

        except Exception as e:
            logger.error("Failed to get process info",
                        service=service_name,
                        error=str(e))

    async def get_all_service_statuses(self) -> Dict[str, ServiceStatus]:
        """Get status of all monitored services"""
        statuses = {}

        for service_name, config in self.monitored_services.items():
            status = await self.check_service_health(service_name, config)
            statuses[service_name] = status

        return statuses

    async def restart_service(self, service_name: str) -> Dict[str, Any]:
        """Restart a service"""
        try:
            if service_name not in self.monitored_services:
                return {"success": False, "error": "Service not found"}

            config = self.monitored_services[service_name]
            service_type = config.get("type", "api")

            if service_type in ["database", "cache"]:
                # Use systemctl for system services
                result = subprocess.run(
                    ["sudo", "systemctl", "restart", service_name],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
            else:
                # For Docker containers or other services
                # This would need to be implemented based on deployment method
                result = subprocess.run(
                    ["docker", "restart", service_name],
                    capture_output=True,
                    text=True,
                    timeout=30
                )

            if result.returncode == 0:
                logger.info("Service restarted successfully", service=service_name)
                return {"success": True, "message": f"Service {service_name} restarted"}
            else:
                error_msg = result.stderr.strip() or "Unknown error"
                logger.error("Service restart failed",
                           service=service_name,
                           error=error_msg)
                return {"success": False, "error": error_msg}

        except Exception as e:
            logger.error("Service restart failed",
                        service=service_name,
                        error=str(e))
            return {"success": False, "error": str(e)}

    async def get_server_info(self) -> Dict[str, Any]:
        """Get comprehensive server information"""
        try:
            metrics = await self.collect_system_metrics()
            services = await self.get_all_service_statuses()

            server_info = {
                "server_id": self.server_id,
                "hostname": self.hostname,
                "environment": self.environment,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "metrics": metrics.to_dict(),
                "services": {name: status.to_dict() for name, status in services.items()},
                "system_info": {
                    "os": os.uname().sysname,
                    "kernel": os.uname().release,
                    "architecture": os.uname().machine,
                    "python_version": os.sys.version
                }
            }

            return server_info

        except Exception as e:
            logger.error("Failed to get server info", error=str(e))
            return {"error": str(e)}

    async def check_alerts(self, metrics: ServerMetrics) -> List[Dict[str, Any]]:
        """Check for system alerts based on thresholds"""
        alerts = []

        # CPU alert
        if metrics.cpu_percent > self.alert_thresholds["cpu_percent"]:
            alerts.append({
                "type": "warning",
                "metric": "cpu",
                "message": ".1f",
                "threshold": self.alert_thresholds["cpu_percent"],
                "current_value": metrics.cpu_percent,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        # Memory alert
        if metrics.memory_percent > self.alert_thresholds["memory_percent"]:
            alerts.append({
                "type": "warning",
                "metric": "memory",
                "message": ".1f",
                "threshold": self.alert_thresholds["memory_percent"],
                "current_value": metrics.memory_percent,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        # Disk alert
        if metrics.disk_percent > self.alert_thresholds["disk_percent"]:
            alerts.append({
                "type": "critical",
                "metric": "disk",
                "message": ".1f",
                "threshold": self.alert_thresholds["disk_percent"],
                "current_value": metrics.disk_percent,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        return alerts

    async def run_health_checks(self) -> Dict[str, Any]:
        """Run comprehensive health checks"""
        try:
            metrics = await self.collect_system_metrics()
            services = await self.get_all_service_statuses()
            alerts = await self.check_alerts(metrics)

            health_report = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "overall_status": self._calculate_overall_status(services, alerts),
                "metrics": metrics.to_dict(),
                "services": {name: status.to_dict() for name, status in services.items()},
                "alerts": alerts,
                "recommendations": self._generate_recommendations(services, alerts, metrics)
            }

            return health_report

        except Exception as e:
            logger.error("Health check failed", error=str(e))
            return {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "overall_status": "error",
                "error": str(e)
            }

    def _calculate_overall_status(self, services: Dict[str, ServiceStatus], alerts: List[Dict[str, Any]]) -> str:
        """Calculate overall system status"""
        # Check for critical alerts
        critical_alerts = [alert for alert in alerts if alert["type"] == "critical"]
        if critical_alerts:
            return "critical"

        # Check for service failures
        failed_services = [s for s in services.values() if s.status in ["error", "stopped"]]
        if failed_services:
            return "degraded"

        # Check for warning alerts
        warning_alerts = [alert for alert in alerts if alert["type"] == "warning"]
        if warning_alerts:
            return "warning"

        return "healthy"

    def _generate_recommendations(self, services: Dict[str, ServiceStatus],
                                alerts: List[Dict[str, Any]], metrics: ServerMetrics) -> List[str]:
        """Generate system recommendations"""
        recommendations = []

        # Service recommendations
        for name, status in services.items():
            if status.status == "error":
                recommendations.append(f"Investigate {name} service failure: {status.error_message}")
            elif status.status == "stopped":
                recommendations.append(f"Restart {name} service")
            elif status.status == "degraded":
                recommendations.append(f"Monitor {name} service performance")

        # Resource recommendations
        if metrics.cpu_percent > 80:
            recommendations.append("High CPU usage detected. Consider scaling or optimization.")
        if metrics.memory_percent > 85:
            recommendations.append("High memory usage detected. Consider adding more RAM or optimization.")
        if metrics.disk_percent > 90:
            recommendations.append("Low disk space. Clean up old files or add storage.")

        return recommendations


# Global server monitor instance
server_monitor = ServerMonitor()
