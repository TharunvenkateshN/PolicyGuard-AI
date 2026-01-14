from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum

class PolicyDocument(BaseModel):
    id: str
    name: str
    content: str
    summary: Optional[str] = None

class WorkflowDefinition(BaseModel):
    name: str
    description: str 

# --- New Report Structure Models ---

class AISystemSpec(BaseModel):
    summary: str
    primary_purpose: str
    decision_authority: str
    automation_level: str
    deployment_stage: str
    geographic_exposure: List[str]

class DataInteractionMap(BaseModel):
    data_categories_detected: List[str] # e.g., ["Personal Identifiers", "Financial Metadata"]
    data_flow_source: str
    data_storage_retention: str
    cross_border_transfer: str

class PolicyStatus(str, Enum):
    COMPLIANT = "Compliant"
    PARTIAL = "Partial Compliance"
    RISK = "At Risk"
    NON_COMPLIANT = "Non-Compliant"

class PolicyAlignment(BaseModel):
    policy_area: str
    status: PolicyStatus
    reason: str

class RiskLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class RiskScore(BaseModel):
    overall_score: int # 0-100
    overall_rating: RiskLevel
    breakdown: Dict[str, RiskLevel] # {"Regulatory": "High", "Reputational": "Low"...}
    confidence_score: str # "High", "Medium", "Low"

class EvidenceTrace(BaseModel):
    source_doc: str # "PRD v2.1", "Architecture Diagram"
    snippet: str # "Section 3.2: Bot may suggest..."

class RecommendationType(str, Enum):
    BLOCKING = "Blocking"
    ADVISORY = "Advisory"
    INFO = "Informational"

class Recommendation(BaseModel):
    title: str
    type: RecommendationType
    description: str
    related_policy: str

class DeploymentVerdict(BaseModel):
    approved: bool
    status_label: str # "Not Approved for Public Release"
    approval_conditions: List[str]

class ComplianceReport(BaseModel):
    system_spec: AISystemSpec
    data_map: DataInteractionMap
    policy_matrix: List[PolicyAlignment]
    risk_assessment: RiskScore
    evidence: List[EvidenceTrace]
    recommendations: List[Recommendation]
    verdict: DeploymentVerdict
