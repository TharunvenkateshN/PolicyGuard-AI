from pydantic import BaseModel, validator
from typing import List, Optional, Dict
from enum import Enum

class PolicyCategory(str, Enum):
    PRIVACY = "Privacy"
    SAFETY = "Safety"
    SECURITY = "Security"
    FINANCIAL = "Financial"
    LEGAL = "Legal"

class PIIAction(str, Enum):
    MASK = "mask"
    REDACT = "redact"
    TOKENIZE = "tokenize"
    BLOCK = "block"
    ALLOW = "allow"

class FrameworkControl(BaseModel):
    framework: str # e.g. "SOC2", "GDPR", "HIPAA"
    control_id: str # e.g. "CC6.1", "Article 32"
    description: str

class PolicyDocument(BaseModel):
    id: str
    name: str
    content: str
    summary: Optional[str] = None
    category: PolicyCategory = PolicyCategory.LEGAL
    weight: float = 1.0 # Multiplier for risk score
    is_active: bool = True
    status: str = "Active"
    version: str = "1.0.0"
    baselines: List[str] = [] # List of previous versions for regression testing
    last_updated: str = ""
    framework_mappings: List[FrameworkControl] = []
    pii_config: Dict[str, PIIAction] = {} # e.g. {"email": "redact", "credit_card": "mask"}
    tags: List[str] = [] # For scoping (agent_id, route, etc)
    regression_score: float = 100.0 # Compliance vs previous version
    # Multi-tenancy namespace (ARCH-4). Default = "default" for backwards compatibility
    # with existing data that pre-dates tenant namespacing.
    tenant_id: str = "default"
    
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

    @validator("status", pre=True)
    def normalize_status(cls, v):
        # Case-insensitive match attempt
        for status in PolicyStatus:
            if v.lower() == status.value.lower():
                return status
        
        # Fuzzy matching for robust LLM handling
        v_str = str(v).lower()
        if "non-compliant" in v_str or "violation" in v_str:
            return PolicyStatus.NON_COMPLIANT
        if "partial" in v_str:
            return PolicyStatus.PARTIAL
        if "at risk" in v_str:
            return PolicyStatus.RISK
        if "compliant" in v_str:
            return PolicyStatus.COMPLIANT
        if "not applicable" in v_str:
            return PolicyStatus.NOT_APPLICABLE
            
        # Default fallback to prevent crash
        return PolicyStatus.CANNOT_ASSESS

class RiskLevel(str, Enum):
    CRITICAL = "Critical"
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
    catastrophic_consequence: Optional[str] = None # Explicit real-world fallout (fines, lawsuits, etc.)

class RiskSimulation(BaseModel):
    scenario_title: str
    failure_mode: str # e.g., "Prompt Injection", "Data Exfiltration"
    description: str
    plausibility_grounding: str # Explains why this is plausible based on known attack vectors
    severity: RiskLevel
    violated_clause: str # Specific policy clause linked to this risk
    confidence_level: str # "High" | "Medium" | "Low"

class ForensicDigest(BaseModel):
    policy_hash: str
    workflow_hash: str
    model_version: str
    prompt_hash: str
    combined_digest: str # SHA-256 over all segments for tamper-evidence

class BusinessImpact(BaseModel):
    financial_exposure: str # "High", "Medium", "Low"
    regulatory_penalty: str # "GDPR Fine up to 20M"
    brand_reputation: str # "Severe Trust Loss"
    estimated_cost: str # "$50k - $200k"

class ComplianceReport(BaseModel):
    report_id: str 
    timestamp: str # ISO date string
    forensic_digest: ForensicDigest # Tamper-evident state snapshot
    workflow_name: Optional[str] = None # Preserved from input
    system_spec: AISystemSpec
    data_map: DataInteractionMap
    policy_matrix: List[PolicyAlignment]
    risk_assessment: RiskScore
    business_impact: Optional[BusinessImpact] = None
    evidence: List[EvidenceTrace]
    risk_simulations: List[RiskSimulation] # Plausible counterfactual failure modes
    recommendations: List[Recommendation]
    verdict: DeploymentVerdict
