from typing import List, Dict
from datetime import datetime
import statistics

class SLAPredictor:
    def __init__(self):
        # In-memory history for MVP: { "service_id": [ {timestamp, metrics...} ] }
        # Limit to last 50 points per service
        self.history: Dict[str, List[dict]] = {}
        self.risk_history: Dict[str, List[dict]] = {}
        
        # Hydrate from DB
        import threading
        threading.Thread(target=self._hydrate, daemon=True).start()
    
    def _hydrate(self):
        try:
            from services.storage import policy_db
            print("[SLA] Hydrating risk history from Firebase...")
            history = policy_db.get_sla_risk_history(limit=50)
            if history:
                 # Reconstruct risk history for default service
                 self.risk_history["default"] = history
                 print(f"[SLA] ✅ Hydrated {len(history)} risk assessments")
        except Exception as e:
            print(f"[SLA] ⚠️ Hydration failed: {e}")

    def ingest_metrics(self, service_id: str, metrics: dict):
        if service_id not in self.history:
            self.history[service_id] = []
        
        # Add timestamp if missing
        if "timestamp" not in metrics:
            metrics["timestamp"] = datetime.now()
            
        self.history[service_id].append(metrics)
        
        # Keep window small
        if len(self.history[service_id]) > 50:
            self.history[service_id].pop(0)

    def predict_risk(self, service_id: str) -> dict:
        data = self.history.get(service_id, [])
        if len(data) < 2:
             return {
                "risk_score": 0.0,
                "risk_label": "Low",
                "factors": ["Insufficient data for prediction"]
            }

        # --- Feature Engineering (Ported from SLA-Guard) ---
        
        # 1. Burn Rate (Simplified)
        # Assuming 99.9% target (0.1% error budget)
        latest = data[-1]
        error_rate = latest.get("error_rate", 0)
        # Burn Rate = Actual Error / Allowed Error (0.001) for the period
        # If error rate is 1% (0.01), burn rate is 10x
        sla_target = 0.001 
        burn_rate = error_rate / sla_target if error_rate > 0 else 0
        
        # 2. Error Trend (Slope of last 5 points)
        error_trend = 0
        if len(data) >= 5:
            errors = [d.get("error_rate", 0) for d in data[-5:]]
            # Simple slope: (last - first) / steps
            error_trend = (errors[-1] - errors[0]) / len(errors)

        # 3. Latency Deviation
        # Compare current latency to moving average of last 20
        latency_deviation = 0
        latencies = [d.get("latency_ms", 0) for d in data]
        if latencies:
            current_lat = latencies[-1]
            avg_lat = statistics.mean(latencies[:-1]) if len(latencies) > 1 else current_lat
            # % Deviation
            if avg_lat > 0:
                latency_deviation = (current_lat - avg_lat) / avg_lat

        # --- Risk Calculation (Rule-based generic model) ---
        
        # Normalize scores to 0-1 range
        score_burn = min(burn_rate / 5, 1.0) # Cap at 5x burn
        score_trend = 1.0 if error_trend > 0.01 else 0.0 # Binary for sharp rise
        score_latency = min(latency_deviation, 1.0) if latency_deviation > 0 else 0
        
        # Weighted Sum
        # Weights: Burn (50%), Trend (30%), Latency (20%)
        risk_val = (0.5 * score_burn) + (0.3 * score_trend) + (0.2 * score_latency)
        risk_val = round(min(risk_val, 1.0), 2)
        
        risk_score = int(risk_val * 100)

        # Drivers
        factors = []
        if score_burn > 0.5: factors.append(f"High Error Budget Burn ({burn_rate:.1f}x)")
        if error_trend > 0: factors.append("Error Rate Increasing")
        if score_latency > 0.2: factors.append(f"Latency Spike ({int(latency_deviation*100)}% above avg)")
        
        if not factors and risk_score < 30:
            factors.append("Stable Optimization")

        result = {
            "risk_score": risk_score,
            "risk_label": "Critical" if risk_score > 75 else "Warning" if risk_score > 40 else "Healthy",
            "factors": factors,
            "timestamp": datetime.now().isoformat()
        }
        
        # Store history (limit 50)
        start_key = service_id
        if start_key not in self.risk_history:
            self.risk_history[start_key] = []
        self.risk_history[start_key].append(result)
        if len(self.risk_history[start_key]) > 50:
             self.risk_history[start_key].pop(0)
             
        # Perist to DB
        try:
            from services.storage import policy_db
            # Run in thread to avoid blocking response
            import threading
            threading.Thread(target=policy_db.add_sla_risk, args=(result,), daemon=True).start()
        except Exception as e:
            print(f"[SLA] Failed to persist risk: {e}")
             
        return result

    def get_risk_history(self, service_id: str) -> List[dict]:
        return self.risk_history.get(service_id, [])

# Global Singleton
sla_predictor = SLAPredictor()
