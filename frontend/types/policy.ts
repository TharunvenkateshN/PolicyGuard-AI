export interface SystemSpec {
    agent_name: string;
    summary: string;
    primary_purpose: string;
    decision_authority: string;
    automation_level: string;
    deployment_stage: string;
    geographic_exposure: string[] | null;
}

export interface DataMap {
    data_categories_detected: string[];
    data_flow_source: string;
    data_storage_retention: string;
    cross_border_transfer: string;
}

export interface PolicyAlignment {
    policy_area: string;
    status: "Compliant" | "Partial Compliance" | "At Risk" | "Non-Compliant" | "Cannot Be Assessed" | "Not Applicable";
    reason: string;
}

export interface RiskScore {
    overall_score: number;
    overall_rating: "High" | "Medium" | "Low";
    breakdown: Record<string, string>;
    confidence_score: string;
}

export interface EvidenceTrace {
    source_doc: string;
    policy_section: string;
    workflow_component: string;
    issue_description: string;
    severity: string;
    snippet: string;
}

export interface Recommendation {
    title: string;
    type: "Blocking" | "Advisory" | "Informational";
    description: string;
    related_policy: string;
}

export interface DeploymentVerdict {
    approved: boolean;
    status_label: string;
    approval_conditions: string[];
}

export interface ComplianceReport {
    workflow_name: string | null;
    system_spec: SystemSpec;
    data_map: DataMap;
    policy_matrix: PolicyAlignment[];
    risk_assessment: RiskScore;
    business_impact: any;
    evidence: EvidenceTrace[];
    recommendations: Recommendation[];
    verdict: DeploymentVerdict;
}
