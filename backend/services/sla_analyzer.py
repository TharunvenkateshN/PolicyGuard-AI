from services.gemini import GeminiService
from services.metrics import metrics_store
import json
import asyncio
import google.generativeai as genai

class SLAAnalyzer:
    """
    Gemini-powered SLA analysis service.
    Provides predictive risk analysis, recommendations, and anomaly detection.
    """
    
    def __init__(self):
        self.gemini = GeminiService()
    
    async def analyze_sla_risk(self) -> dict:
        """Use Gemini Pro to predict SLA risk with Epistemic Humility and Calibrated Confidence."""
        
        # Get current metrics and history
        current = metrics_store.get_current_metrics()
        history = metrics_store.get_history(hours=24)
        
        # Build structured prompt with Epistemic Constraints
        prompt = f"""You are the 'SLA-Guard Epistemic Engine'. 
Analyze telemetry data and predict risk while acknowledging distributional uncertainty.

SYSTEM METRICS:
{json.dumps(current, indent=2)}

HISTORICAL CONTEXT (24h Window):
{json.dumps(history[-20:] if len(history) > 20 else history, indent=2)}

EPISTEMIC REQUIREMENTS:
1. Provide a Risk Score (0-100).
2. CALIBRATION: Categorize confidence as 'Established' (Stable historical patterns), 'Experimental' (New workload detected), or 'Unstable' (Noisy/non-stationary).
3. EVIDENCE PROVENANCE: What specific metric signals indicate the risk?
4. UNKNOWN FACTORS: What data is missing or out-of-distribution? (e.g. cold-start variance).
5. Forecast next 60m ONLY if historical stationary holds.

OUTPUT FORMAT: Strict JSON only."""
        
        try:
            # Use the Pro model for deep SLA reasoning
            analysis_json = await self.gemini.analyze_sla(current)
            analysis = json.loads(analysis_json)
            
            # Enrich with Calibration Metadata
            analysis.update({
                "timestamp": current['timestamp'],
                "provenance": {
                    "method": "Gemini-1.5-Pro-Calibration",
                    "calibration_level": analysis.get("calibration", "Experimental"),
                    "evidence_strength": "High" if len(history) > 50 else "Limited",
                    "is_stationary": analysis.get("is_stationary", True)
                },
                "risk_factors": analysis.get("risk_factors", [
                    {"factor": "Latency Volatility", "severity": "medium", "impact_percentage": 15}
                ])
            })
            
            # Persist Analysis to DB
            try:
                from services.storage import policy_db
                # Run in background to avoid blocking
                policy_db.add_sla_analysis(analysis)
            except Exception as e:
                print(f"[SLA Analyzer] Failed to persist report: {e}")
                
            return analysis
            
        except asyncio.TimeoutError:
            print("[SLA Analyzer] Gemini Analysis Timed Out (15s)")
            return self._get_fallback_analysis(current)
        except json.JSONDecodeError as e:
            print(f"[SLA Analyzer] JSON parse error: {e}")
            print(f"[SLA Analyzer] Response: {response_text[:500]}")
            
            # Return fallback analysis
            return self._get_fallback_analysis(current)
        except Exception as e:
            print(f"[SLA Analyzer] Error: {e}")
            return self._get_fallback_analysis(current)
    
    def _get_fallback_analysis(self, current: dict) -> dict:
        """Provide rule-based analysis if Gemini fails"""
        
        # Calculate simple risk score
        risk_score = 0
        risk_factors = []
        
        # Check uptime
        if current['uptime_percentage'] < 99.9:
            risk_score += 30
            risk_factors.append({
                "factor": "Uptime below SLA target",
                "severity": "high",
                "impact_percentage": 30
            })
        
        # Check response time
        if current['avg_response_time_ms'] > 500:
            risk_score += 25
            risk_factors.append({
                "factor": "High average response time",
                "severity": "medium",
                "impact_percentage": 25
            })
        
        # Check error rate
        if current['success_rate'] < 99:
            risk_score += 20
            risk_factors.append({
                "factor": "Elevated error rate",
                "severity": "medium",
                "impact_percentage": 20
            })
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = "critical"
        elif risk_score >= 40:
            risk_level = "high"
        elif risk_score >= 20:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "risk_score": min(risk_score, 100),
            "risk_level": risk_level,
            "risk_factors": risk_factors if risk_factors else [
                {
                    "factor": "System operating normally",
                    "severity": "low",
                    "impact_percentage": 0
                }
            ],
            "trend_analysis": {
                "direction": "stable",
                "confidence": 0.7,
                "summary": "System metrics are within acceptable ranges."
            },
            "recommendations": [
                {
                    "priority": "low",
                    "action": "Continue monitoring",
                    "reason": "No immediate issues detected",
                    "expected_impact": "Maintain current SLA compliance"
                }
            ],
            "forecast": {
                "next_hour_uptime": current['uptime_percentage'],
                "next_hour_avg_latency": current['avg_response_time_ms'],
                "breach_probability": risk_score / 100
            },
            "anomalies": [],
            "insights": "System is operating within normal parameters.",
            "timestamp": current['timestamp'],
            "current_uptime": current['uptime_percentage'],
            "current_latency": current['avg_response_time_ms'],
            "fallback": True
        }

# Global instance
sla_analyzer = SLAAnalyzer()
