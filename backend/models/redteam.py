from pydantic import BaseModel
from typing import List, Optional

class AttackScenario(BaseModel):
    name: str
    category: str # e.g. "Prompt Injection", "Data Exfiltration"
    method: str
    likelihood: str # High, Medium, Low
    impact: str # Critical, High, Medium, Low
    severity_score: int # 0-100
    mitigation_suggestion: str

class ThreatReport(BaseModel):
    system_profile_analyzed: str
    attack_vectors: List[AttackScenario]
    overall_resilience_score: int # 0-100 (100 is perfectly secure)
    critical_finding: str
