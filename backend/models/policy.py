from pydantic import BaseModel, validator
from typing import List, Optional, Dict
from enum import Enum

class PolicyDocument(BaseModel):
    id: str
    name: str
    content: str
    summary: Optional[str] = None
    is_active: bool = True

class WorkflowDefinition(BaseModel):
    name: str
    description: str 

# --- New Report Structure Models ---

class AISystemSpec(BaseModel):
    agent_name: str # e.g. "MortgageBot", "PaymentAssistant"
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
    CANNOT_ASSESS = "Cannot Be Assessed"
    NOT_APPLICABLE = "Not Applicable"

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
    source_doc: str # "PRD", "Policy"
    policy_section: str # "Section 3.1: GDPR Data Residency"
    workflow_component: str # "Data Storage Layer"
    issue_description: str # "Architecture allows US-based processing..."
    severity: str # "High", "Medium", "Low"
    snippet: str | List[str] # Validates both, normalizes to str via validator

    @validator("snippet", pre=True)
    def normalize_snippet(cls, v):
        if isinstance(v, list):
            return " ".join(v)
        return v

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

class BusinessImpact(BaseModel):
    financial_exposure: str # "High", "Medium", "Low"
    regulatory_penalty: str # "GDPR Fine up to 20M"
    brand_reputation: str # "Severe Trust Loss"
    estimated_cost: str # "$50k - $200k"

class ComplianceReport(BaseModel):
    workflow_name: Optional[str] = None # Preserved from input
    system_spec: AISystemSpec
    data_map: DataInteractionMap
    policy_matrix: List[PolicyAlignment]
    risk_assessment: RiskScore
    business_impact: Optional[BusinessImpact] = None
    evidence: List[EvidenceTrace]
    recommendations: List[Recommendation]
    verdict: DeploymentVerdict
