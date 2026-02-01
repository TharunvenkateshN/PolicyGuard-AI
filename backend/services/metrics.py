from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from collections import deque
import statistics
import json

@dataclass
class RequestMetric:
    """Individual request metric"""
    timestamp: datetime
    duration_ms: float
    status_code: int
    pii_detected: bool
    policy_violation: bool
    endpoint: str

@dataclass
class AuditLog:
    """Real-time audit event log"""
    timestamp: str
    event: str
    status: str # INFO, PASS, BLOCK, WARN
    details: Optional[str] = None

class MetricsStore:
    """
    In-memory metrics store for SLA tracking.
    Tracks requests, calculates performance metrics, and maintains uptime statistics.
    """
    
    def __init__(self, max_history: int = 10000):
        self.requests: deque = deque(maxlen=max_history)
        self.audit_logs: deque = deque(maxlen=50) # Keep last 50 audit events
        self.start_time = datetime.now()
        self.total_downtime_seconds = 0.0  # Track total downtime for uptime calculations
        self.db = None
        # Lazy load db connection
        try:
             from services.storage import policy_db
             self.db = policy_db.db
        except: pass
        
    def record_request(
        self,
        duration_ms: float,
        status_code: int,
        pii_detected: bool = False,
        policy_violation: bool = False,
        endpoint: str = "/v1/chat/completions"
    ):
        """Record a single request metric"""
        print(f"[METRICS] Request: {endpoint} (status={status_code}, violation={policy_violation})")
        metric = RequestMetric(
            timestamp=datetime.now(),
            duration_ms=duration_ms,
            status_code=status_code,
            pii_detected=pii_detected,
            policy_violation=policy_violation,
            endpoint=endpoint
        )
        self.requests.append(metric)
        
        # Persist to Firebase if available
        if self.db:
            try:
                self.db.collection('proxy_metrics').add({
                    "timestamp": metric.timestamp.isoformat(),
                    "duration_ms": duration_ms,
                    "status_code": status_code,
                    "pii_detected": pii_detected,
                    "policy_violation": policy_violation,
                    "endpoint": endpoint
                })
            except Exception as e:
                print(f"Failed to persist metric: {e}")

    def record_audit_log(self, event: str, status: str = "INFO", details: Optional[str] = None):
        """Record a real-time audit event"""
        print(f"[METRICS] Audit: {event} ({status})")
        log = AuditLog(
            timestamp=datetime.now().isoformat(),
            event=event,
            status=status,
            details=details
        )
        self.audit_logs.append(log)
        
        # Persist to Firebase if available
        if self.db:
            try:
                self.db.collection('proxy_logs').add(asdict(log))
            except Exception as e:
                 print(f"Failed to persist audit log: {e}")

    def get_audit_logs(self) -> List[Dict]:
        """Get recent audit logs"""
        return [asdict(log) for log in self.audit_logs]
    
    def _get_requests_in_window(self, minutes: int) -> List[RequestMetric]:
        """Get requests within the last N minutes"""
        cutoff = datetime.now() - timedelta(minutes=minutes)
        return [r for r in self.requests if r.timestamp >= cutoff]
    
    def get_current_metrics(self) -> Dict:
        """Get current SLA metrics snapshot"""
        now = datetime.now()
        uptime_seconds = (now - self.start_time).total_seconds()
        
        # Get requests from different time windows (Widened 1min to 2min for stability)
        last_2min = self._get_requests_in_window(2)
        last_5min = self._get_requests_in_window(5)
        last_1hour = self._get_requests_in_window(60)
        all_requests = list(self.requests)
        
        # Calculate metrics
        total_requests = len(all_requests)
        successful_requests = len([r for r in all_requests if 200 <= r.status_code < 300])
        failed_requests = total_requests - successful_requests
        
        # Response times
        response_times = sorted([r.duration_ms for r in all_requests if r.duration_ms > 0])
        avg_response_time = statistics.mean(response_times) if response_times else 0
        
        # Dynamic Percentile Calculation (Works even with 1 request)
        def get_percentile(data: List[float], p: float) -> float:
            if not data: return 0
            idx = int(len(data) * p)
            return data[min(idx, len(data) - 1)]

        p95_response_time = get_percentile(response_times, 0.95)
        p99_response_time = get_percentile(response_times, 0.99)
        
        # Uptime calculation (99.9% target)
        uptime_percentage = ((uptime_seconds - self.total_downtime_seconds) / uptime_seconds * 100) if uptime_seconds > 0 else 100.0
        
        # Throughput
        requests_per_minute = round(len(last_2min) / 2, 1)
        requests_per_hour = len(last_1hour)
        
        # PolicyGuard Specific Metrics
        pii_blocks = len([r for r in all_requests if r.pii_detected])
        policy_violations = len([r for r in all_requests if r.policy_violation])
        pg_blocks = len([r for r in all_requests if r.pii_detected or r.policy_violation])
        pg_passed = total_requests - pg_blocks

        print(f"[METRICS] Periodic Stats: total={total_requests}, live_rpm={requests_per_minute}, blocks={pg_blocks}")

        return {
            "timestamp": now.isoformat(),
            "uptime_percentage": round(uptime_percentage, 3),
            "uptime_seconds": round(uptime_seconds, 2),
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "failed_requests": failed_requests,
            "pg_blocks": pg_blocks,
            "pg_passed": pg_passed,
            "pii_blocks": pii_blocks,
            "policy_violations": policy_violations,
            "success_rate": round((successful_requests / total_requests * 100) if total_requests > 0 else 100.0, 2),
            "avg_response_time_ms": round(avg_response_time, 2),
            "p95_response_time_ms": round(p95_response_time, 2),
            "p99_response_time_ms": round(p99_response_time, 2),
            "requests_per_minute": requests_per_minute,
            "requests_per_hour": requests_per_hour,
            "sla_status": self._get_sla_status(uptime_percentage)
        }
    
    def _get_sla_status(self, uptime: float) -> str:
        """Determine SLA status based on uptime"""
        if uptime >= 99.9:
            return "healthy"
        elif uptime >= 99.0:
            return "at_risk"
        else:
            return "violated"
    
    def get_history(self, hours: int = 24) -> List[Dict]:
        """Get historical metrics grouped by time intervals"""
        cutoff = datetime.now() - timedelta(hours=hours)
        recent_requests = [r for r in self.requests if r.timestamp >= cutoff]
        
        # Group by 5-minute intervals
        intervals = {}
        for req in recent_requests:
            interval_key = req.timestamp.replace(second=0, microsecond=0)
            interval_key = interval_key.replace(minute=(interval_key.minute // 5) * 5)
            
            if interval_key not in intervals:
                intervals[interval_key] = []
            intervals[interval_key].append(req)
        
        # Calculate metrics for each interval
        history = []
        for timestamp, requests in sorted(intervals.items()):
            response_times = [r.duration_ms for r in requests]
            successful = len([r for r in requests if 200 <= r.status_code < 300])
            
            history.append({
                "timestamp": timestamp.isoformat(),
                "total_requests": len(requests),
                "successful_requests": successful,
                "avg_response_time_ms": round(statistics.mean(response_times), 2) if response_times else 0,
                "pii_blocks": len([r for r in requests if r.pii_detected]),
                "policy_violations": len([r for r in requests if r.policy_violation])
            })
        
        return history
    
    def get_uptime_stats(self) -> Dict:
        """Get detailed uptime statistics"""
        now = datetime.now()
        uptime_seconds = (now - self.start_time).total_seconds()
        uptime_percentage = ((uptime_seconds - self.total_downtime_seconds) / uptime_seconds * 100) if uptime_seconds > 0 else 100.0
        
        return {
            "start_time": self.start_time.isoformat(),
            "current_time": now.isoformat(),
            "total_uptime_seconds": round(uptime_seconds, 2),
            "total_downtime_seconds": round(self.total_downtime_seconds, 2),
            "uptime_percentage": round(uptime_percentage, 3),
            "sla_target": 99.9,
            "sla_met": uptime_percentage >= 99.9,
            "sla_status": self._get_sla_status(uptime_percentage)
        }
    
    def record_downtime(self, duration_seconds: float):
        """Record a downtime event"""
        self.total_downtime_seconds += duration_seconds

# Global metrics instance
metrics_store = MetricsStore()
