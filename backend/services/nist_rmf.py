"""
PolicyGuard-AI: NIST AI Risk Management Framework (AI RMF) Integration

Maps PolicyGuard internal threat/violation categories to the NIST AI RMF 1.0
four core functions: GOVERN, MAP, MEASURE, MANAGE.

Reference: https://www.nist.gov/artificial-intelligence/ai-risk-management-framework

Architecture note: this module is intentionally parallel to mitre_atlas.py.
Both implement the same interface (_FrameworkMapper protocol) so additional
governance frameworks (EU AI Act, ISO/IEC 42001, Canada AIDA) can be added
by creating a new file with the same mapping_table + map_threats() signature.

GOVERN  — Policies, accountability, culture around AI risk
MAP     — Categorise context; identify and assess AI risks
MEASURE — Analyse and assess AI risks quantitatively / qualitatively
MANAGE  — Prioritise, respond to, monitor, and improve risk posture
"""

from typing import Dict, List, Any

# ---------------------------------------------------------------------------
# NIST AI RMF control table
# Keys match PolicyGuard internal threat type strings (same as mitre_atlas.py)
# ---------------------------------------------------------------------------

NIST_RMF_MAP: Dict[str, Dict[str, Any]] = {
    "prompt_injection": {
        "function": "MANAGE",
        "category": "MG-2.2",
        "subcategory": "Responses to identified risks are prioritized",
        "action": "Deploy runtime input validation and output filtering guardrails.",
        "severity": "CRITICAL",
    },
    "pii_leakage": {
        "function": "GOVERN",
        "category": "GV-1.1",
        "subcategory": "Organisational policies establish AI risk accountability",
        "action": "Enforce data minimisation and PII redaction policies in all AI outputs.",
        "severity": "HIGH",
    },
    "jailbreak": {
        "function": "MEASURE",
        "category": "MS-2.5",
        "subcategory": "Risks are assessed against TEVV criteria",
        "action": "Red-team adversarial robustness and validate against jailbreak attack corpus.",
        "severity": "HIGH",
    },
    "role_play_bypass": {
        "function": "MEASURE",
        "category": "MS-2.5",
        "subcategory": "Risks are assessed against TEVV criteria",
        "action": "Test system prompt resistance to persona hijacking and role-play vectors.",
        "severity": "HIGH",
    },
    "indirect_prompt_injection": {
        "function": "MANAGE",
        "category": "MG-2.4",
        "subcategory": "Risk response plans include monitoring and incident management",
        "action": "Implement document-source trust levels and indirect injection detection.",
        "severity": "HIGH",
    },
    "model_extraction": {
        "function": "GOVERN",
        "category": "GV-2.2",
        "subcategory": "AI risk management is integrated with organisational risk",
        "action": "Rate-limit inference endpoints and monitor for systematic enumeration patterns.",
        "severity": "MEDIUM",
    },
    "supply_chain_poisoning": {
        "function": "MAP",
        "category": "MP-5.1",
        "subcategory": "Organisational risk tolerance informs AI risk decisions",
        "action": "Audit and verify all third-party model and data supply chain components.",
        "severity": "HIGH",
    },
    "training_data_poison": {
        "function": "MAP",
        "category": "MP-4.1",
        "subcategory": "AI risks are identified and documented",
        "action": "Implement data provenance tracking and statistical outlier detection in training.",
        "severity": "HIGH",
    },
    "hallucination": {
        "function": "MEASURE",
        "category": "MS-2.6",
        "subcategory": "Trustworthiness characteristics are assessed in context",
        "action": "Measure factual accuracy with automated grounding checks and human review.",
        "severity": "MEDIUM",
    },
    "rate_limit_abuse": {
        "function": "MANAGE",
        "category": "MG-3.1",
        "subcategory": "Risk responses are monitored and reviewed",
        "action": "Implement adaptive rate limiting and anomaly detection on API usage patterns.",
        "severity": "MEDIUM",
    },
    "evasion": {
        "function": "MEASURE",
        "category": "MS-2.3",
        "subcategory": "AI system performance is regularly evaluated",
        "action": "Continuously evaluate model robustness against adversarial perturbation datasets.",
        "severity": "HIGH",
    },
    "misinformation": {
        "function": "GOVERN",
        "category": "GV-6.1",
        "subcategory": "Policies on human rights and safety are documented",
        "action": "Implement output factuality scoring and escalation thresholds for AI-generated content.",
        "severity": "HIGH",
    },
    "toxicity": {
        "function": "GOVERN",
        "category": "GV-6.2",
        "subcategory": "Policies protect individual dignity and rights",
        "action": "Deploy toxicity classifiers as mandatory egress filters.",
        "severity": "HIGH",
    },
    "bias": {
        "function": "MEASURE",
        "category": "MS-2.10",
        "subcategory": "Privacy risk is evaluated for AI systems",
        "action": "Conduct regular fairness audits across demographic subgroups.",
        "severity": "HIGH",
    },
    "unauthorized_tool_call": {
        "function": "MANAGE",
        "category": "MG-2.2",
        "subcategory": "Responses to identified risks are prioritized",
        "action": "Enforce allowlisting for agentic tool calls; require human approval for high-impact actions.",
        "severity": "CRITICAL",
    },
    "financial_harm": {
        "function": "GOVERN",
        "category": "GV-1.2",
        "subcategory": "Accountability for AI risk management is assigned",
        "action": "Require dual-authorisation and audit trail for all AI-initiated financial transactions.",
        "severity": "CRITICAL",
    },
    "data_exfiltration": {
        "function": "MANAGE",
        "category": "MG-2.4",
        "subcategory": "Risk response plans include monitoring and incident management",
        "action": "Implement egress filtering and data-loss prevention on all AI agent outputs.",
        "severity": "CRITICAL",
    },
}

_DEFAULT_CONTROL: Dict[str, Any] = {
    "function": "MAP",
    "category": "MP-3.5",
    "subcategory": "AI risks are documented and communicated to decision-makers",
    "action": "Review and document the identified risk against the NIST AI RMF control catalogue.",
    "severity": "MEDIUM",
}

# Human-readable function descriptions for report generation
FUNCTION_DESCRIPTIONS: Dict[str, str] = {
    "GOVERN": "Policies, roles, and processes to manage AI risk at the organisational level",
    "MAP":    "Identify and categorise AI risk context, stakeholders, and potential impacts",
    "MEASURE": "Analyse, assess, and quantify AI risks and trustworthiness properties",
    "MANAGE": "Prioritise, respond to, monitor, and improve identified AI risks",
}


class NistRmfMapper:
    """
    Maps PolicyGuard threat types to NIST AI RMF 1.0 controls.
    Designed to be a drop-in complement to MitreAtlasMapper.
    """

    def map_threat(self, threat_type: str) -> Dict[str, Any]:
        """Return the NIST AI RMF control entry for a single threat type."""
        key = threat_type.lower().replace(" ", "_").replace("-", "_")
        control = NIST_RMF_MAP.get(key, _DEFAULT_CONTROL).copy()
        control["threat_type"] = threat_type
        control["function_description"] = FUNCTION_DESCRIPTIONS.get(control["function"], "")
        control["framework"] = "NIST AI RMF 1.0"
        control["reference_url"] = "https://airc.nist.gov/Docs/1"
        return control

    def map_threats(self, threats: List[Dict]) -> List[Dict]:
        """
        Enrich a list of threat dicts (as returned by MitreAtlasMapper or GeminiService)
        with NIST AI RMF control mappings.

        Each input dict should have a 'threat_type' key; all other keys are preserved.
        """
        enriched = []
        for threat in threats:
            threat_type = threat.get("threat_type", threat.get("type", "unknown"))
            rmf_control = self.map_threat(threat_type)
            enriched.append({**threat, "nist_rmf": rmf_control})
        return enriched

    def get_function_summary(self, threats: List[Dict]) -> Dict[str, List[str]]:
        """
        Aggregate threats by NIST function for an executive summary.
        Returns {function: [threat_type, ...]}
        """
        summary: Dict[str, List[str]] = {f: [] for f in FUNCTION_DESCRIPTIONS}
        for threat in threats:
            threat_type = threat.get("threat_type", threat.get("type", "unknown"))
            key = threat_type.lower().replace(" ", "_").replace("-", "_")
            func = NIST_RMF_MAP.get(key, _DEFAULT_CONTROL)["function"]
            summary[func].append(threat_type)
        return summary

    def generate_action_plan(self, threats: List[Dict]) -> List[Dict]:
        """
        Return a deduplicated list of recommended actions, grouped by function and priority.
        """
        seen_actions: set = set()
        plan: List[Dict] = []
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}

        for threat in sorted(
            threats,
            key=lambda t: severity_order.get(
                NIST_RMF_MAP.get(
                    t.get("threat_type", "").lower().replace(" ", "_"),
                    _DEFAULT_CONTROL,
                ).get("severity", "MEDIUM"),
                2,
            ),
        ):
            threat_type = threat.get("threat_type", threat.get("type", "unknown"))
            control = self.map_threat(threat_type)
            action_key = f"{control['category']}:{control['action']}"
            if action_key not in seen_actions:
                seen_actions.add(action_key)
                plan.append({
                    "priority": control["severity"],
                    "function": control["function"],
                    "category": control["category"],
                    "action": control["action"],
                    "triggered_by": threat_type,
                })

        return plan


# Global singleton — mirrors the pattern used by mitre_atlas.py
nist_rmf_mapper = NistRmfMapper()
