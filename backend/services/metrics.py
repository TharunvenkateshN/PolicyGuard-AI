from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from collections import deque
import statistics
import json
import threading
import os

@dataclass
class RequestMetric:
    """Individual request metric"""
    id: str
    timestamp: datetime
    duration_ms: float
    status_code: int
    pii_detected: bool
    policy_violation: bool
    endpoint: str

@dataclass
class AuditLog:
    """Real-time audit event log"""
    id: str
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
    def set_db(self, db):
        """Manually attach database client to avoid circular imports"""
        self.db = db
        print(f"[METRICS] DB Connection attached: {self.db is not None}")
        if self.db:
             threading.Thread(target=self._hydrate_history, daemon=True).start()
        
        # Persistence and Hydration handled after set_db or on first use in local mode
        self._dirty = False # Flag for local periodic save
        self._stop_event = threading.Event()
        
        # If in local mode, we can hydrate immediately
        from config import settings
        if not settings.USE_FIREBASE:
             threading.Thread(target=self._hydrate_history, daemon=True).start()
             threading.Thread(target=self._periodic_save_loop, daemon=True).start()
        
    def _hydrate_history(self):
        """Load history from persistent store (Firebase or Local)"""
        # Give DB connection a moment to stabilize if it's being set asynchronously?
        # Actually storage.py sets self.db synchronously in __init__.
        
        if self.db:
            self._load_history_from_firebase()
        else:
            print("[METRICS] Hydrating history from local file...")
            self._load_history_from_local()

    def _load_history_from_firebase(self):
        try:
            from firebase_admin import firestore
            print("[METRICS] Hydrating history from Firebase...")
            
            # Fetch last 500 requests (approx 1 hour of heavy traffic)
            # Ordered manually to avoid index errors if composite index missing
            # Using simple order-by timestamp if possible
            docs = self.db.collection('proxy_metrics')\
                .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                .limit(500).stream()
            
            loaded = []
            for doc in docs:
                d = doc.to_dict()
                try:
                    loaded.append(RequestMetric(
                        id=d.get('id', 'legacy-req'),
                        timestamp=datetime.fromisoformat(d['timestamp']),
                        duration_ms=d.get('duration_ms', 0),
                        status_code=d.get('status_code', 200),
                        pii_detected=d.get('pii_detected', False),
                        policy_violation=d.get('policy_violation', False),
                        endpoint=d.get('endpoint', 'unknown')
                    ))
                except: pass
            
            # Append in chronological order (Oldest first)
            for m in reversed(loaded):
                self.requests.append(m)
                
            print(f"[METRICS] SUCCESS: Hydrated {len(loaded)} historical requests")
        except Exception as e:
            print(f"[METRICS] WARNING: History hydration failed: {e}")
        
    def record_request(
        self,
        duration_ms: float,
        status_code: int,
        pii_detected: bool = False,
        policy_violation: bool = False,
        endpoint: str = "/v1/chat/completions",
        request_id: str = None
    ):
        """Record a single request metric"""
        import uuid
        if not request_id:
             request_id = f"req-{uuid.uuid4().hex[:8]}"

        print(f"[METRICS] Request: {endpoint} (status={status_code}, violation={policy_violation}, id={request_id})")
        
        metric = RequestMetric(
            id=request_id,
            timestamp=datetime.now(),
            duration_ms=duration_ms,
            status_code=status_code,
            pii_detected=pii_detected,
            policy_violation=policy_violation,
            endpoint=endpoint
        )
        self.requests.append(metric)
        
        # Persist metrics
        if self.db:
            def _persist():
                try:
                    self.db.collection('proxy_metrics').add({
                        "id": request_id,
                        "timestamp": metric.timestamp.isoformat(),
                        "duration_ms": duration_ms,
                        "status_code": status_code,
                        "pii_detected": pii_detected,
                        "policy_violation": policy_violation,
                        "endpoint": endpoint
                    })
                except Exception as e:
                    print(f"[METRICS ERR] Failed to persist metric: {e}")
            
            import threading
            threading.Thread(target=_persist, daemon=True).start()
        else:
            # Local mode: Mark dirty for debounced periodic save
            self._dirty = True

    def record_audit_log(self, event: str, status: str = "INFO", details: Optional[str] = None, log_id: str = None):
        """Record a real-time audit event"""
        import uuid
        if not log_id:
            log_id = f"log-{uuid.uuid4().hex[:8]}"
            
        print(f"[METRICS] Audit: {event} ({status}) [ID: {log_id}]")
        log = AuditLog(
            id=log_id,
            timestamp=datetime.now().isoformat(),
            event=event,
            status=status,
            details=details
        )
        self.audit_logs.append(log)
        
        # Persist audit logs
        if self.db:
            def _persist_log():
                try:
                    self.db.collection('proxy_logs').add(asdict(log))
                except Exception as e:
                    print(f"[METRICS ERR] Failed to persist audit log: {e}")
            
            import threading
            threading.Thread(target=_persist_log, daemon=True).start()
        else:
            # Local mode: Mark dirty for debounced periodic save
            self._dirty = True

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
        
        # Lexinel AML Specific Metrics
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

    def _load_history_from_local(self):
        """Load history from local metrics_store.json"""
        if os.path.exists("metrics_store.json"):
            try:
                with open("metrics_store.json", "r") as f:
                    data = json.load(f)
                    loaded_requests = data.get('requests', [])
                    for d in loaded_requests:
                        self.requests.append(RequestMetric(
                            id=d.get('id', 'legacy-req-local'),
                            timestamp=datetime.fromisoformat(d['timestamp']),
                            duration_ms=d.get('duration_ms', 0),
                            status_code=d.get('status_code', 200),
                            pii_detected=d.get('pii_detected', False),
                            policy_violation=d.get('policy_violation', False),
                            endpoint=d.get('endpoint', 'unknown')
                        ))
                    
                    loaded_logs = data.get('audit_logs', [])
                    for d in loaded_logs:
                        self.audit_logs.append(AuditLog(**d))
                    
                print(f"[METRICS] SUCCESS: Loaded {len(loaded_requests)} requests and {len(loaded_logs)} logs from disk")
            except Exception as e:
                print(f"[METRICS] ERROR: Failed to load local history: {e}")

    def _save_to_local(self):
        """Save current in-memory metrics to local disk"""
        try:
            data = {
                "requests": [
                    {
                        **asdict(r),
                        "timestamp": r.timestamp.isoformat()
                    } for r in self.requests
                ],
                "audit_logs": [asdict(l) for l in self.audit_logs]
            }
            with open("metrics_store.json", "w") as f:
                json.dump(data, f)
            self._dirty = False
        except Exception as e:
            print(f"[METRICS] ERROR: Failed to save local history: {e}")

    def _periodic_save_loop(self):
        """Background loop to save dirty metrics every 10 seconds"""
        import time
        while not self._stop_event.is_set():
            if self._dirty:
                self._save_to_local()
            time.sleep(10)

# Global metrics instance
metrics_store = MetricsStore()
