from typing import List, Tuple, Dict
import re
from models.policy import PolicyDocument, PIIAction, PolicyCategory
from services.storage import policy_db

class PolicyEngine:
    def __init__(self):
        self.pii_patterns = {
            "email": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
            "ssn": r"\d{3}[ -]\d{2}[ -]\d{4}",
            "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
            "credit_card": r"\b(?:\d[ -]*?){13,16}\b",
            "secret": r"(?i)(api[_-]?key|secret|password|auth[_-]?token)[\s:=]+([a-zA-Z0-9_\-\.]{16,})"
        }

    def resolve_conflicts(self, findings: List[Dict]) -> Tuple[bool, str]:
        """
        Implements 'Most Restrictive Wins' (MRW) tie-breaking logic.
        Precedence: HEURISTIC -> BLOCK -> REDACT -> MASK -> ALLOW
        """
        if not findings:
            return False, "Allow: No violations detected."
        
        # Priority mapping
        priority = {"BLOCK": 10, "REDACT": 5, "MASK": 3, "ALLOW": 0}
        
        highest_finding = max(findings, key=lambda x: priority.get(x["action"], 0))
        
        is_blocked = highest_finding["action"] == "BLOCK"
        reason = highest_finding["reason"]
        
        return is_blocked, reason

    def evaluate_prompt(self, prompt: str, agent_id: str = "default", route: str = None) -> Tuple[bool, str, Dict]:
        """
        Evaluates a prompt with Epistemic Humility and Deterministic Arbitration.
        1. Immutable Deterministic Core (PII/Hard Keywords)
        2. Policy Hierarchy Arbitration (Most Restrictive Wins)
        3. Logic Drift with Evidence Hooks
        """
        metadata = {
            "evidence": [],
            "redactions": 0,
            "arbitration": "Policy Precedence",
            "confidence_provenance": "Rule-Based Deterministic",
            "risk_score": 0.0,
            "drift": {"detected": False, "p_value": 1.0, "entropy": 0.0}
        }
        
        processed_prompt = prompt
        findings = []

        # -- SAFETY ANCHOR: Input Validation (Against Meta-Guardrail Injection) --
        if not prompt or len(prompt.strip()) < 2:
            return False, prompt, {**metadata, "reason": "System: Input minimal, skipping evaluation."}

        # -- HEALTH CHECK: Governance Safe-Mode --
        try:
            all_policies = policy_db.get_all_policies()
        except Exception as e:
            # Blast Radius Mitigation: Fail-Closed on Governance Failure
            return True, prompt, {**metadata, "reason": "CRITICAL: Policy Storage Unhealthy. Safe-Mode FAIL-CLOSED active.", "policy": "System Safety Anchor"}

        active_policies = [p for p in all_policies if p.is_active]
        if not active_policies:
            return True, prompt, {**metadata, "reason": "Zero-Trust: No active policies. Default BLOCK.", "policy": "Default Deny"}

        # -- CONTEXTUAL FILTERING & PRECEDENCE --
        context_policies = []
        for p in active_policies:
            tags = getattr(p, 'tags', [])
            if not tags or (agent_id in tags) or (route and route in tags):
                context_policies.append(p)

        # -- DETERMINISTIC CORE: Logic Drift (Shannon Entropy Engine) --
        # Calculates word-frequency Shannon entropy to detect repetitive injection patterns.
        # Normal English: ~4.0-5.0 bits/word. Repetitive attacks ("ignore ignore..."): ~0.5.
        # Threshold and minimum word count are configurable via settings / env vars:
        #   ENTROPY_COLLAPSE_THRESHOLD (default 3.2) and ENTROPY_MIN_WORDS (default 20).
        words = prompt.split()
        if len(words) >= settings.ENTROPY_MIN_WORDS:
            import math
            from collections import Counter

            counts = Counter(words)
            total = len(words)
            entropy = -sum((c / total) * math.log2(c / total) for c in counts.values())

            metadata["drift"]["entropy"] = round(entropy, 4)

            if entropy < settings.ENTROPY_COLLAPSE_THRESHOLD:
                metadata["drift"].update({
                    "detected": True,
                    "p_value": round(math.exp(-entropy), 6),
                    "reason": (
                        f"Entropy collapse detected ({metadata['drift']['entropy']:.4f} bits/word, "
                        f"threshold {settings.ENTROPY_COLLAPSE_THRESHOLD})."
                    ),
                })
                findings.append({
                    "action": "BLOCK",
                    "reason": "Logic Drift: Information density too low for legitimate natural language.",
                    "source": "Information Theory Engine",
                })

        # -- POLICY SCAN --
        for policy in context_policies:
            # PII Evaluation
            for p_type, action in policy.pii_config.items():
                pattern = self.pii_patterns.get(p_type)
                if pattern and re.search(pattern, processed_prompt):
                    if action == PIIAction.BLOCK:
                        findings.append({"action": "BLOCK", "reason": f"Conflict Resolve: {p_type.upper()} strictly forbidden by {policy.name}", "source": policy.name})
                    
                    elif action == PIIAction.REDACT:
                        processed_prompt = re.sub(pattern, f"[REDACTED_{p_type.upper()}]", processed_prompt)
                        metadata["redactions"] += 1
                        findings.append({"action": "REDACT", "reason": f"Metadata: {p_type.upper()} redacted.", "source": policy.name})
                    
                    elif action == PIIAction.MASK:
                        def mask_val(m):
                            val = m.group(0)
                            return val[:2] + "*" * (len(val)-4) + val[-2:] if len(val) > 4 else "*" * len(val)
                        processed_prompt = re.sub(pattern, mask_val, processed_prompt)
                        metadata["redactions"] += 1
                        findings.append({"action": "MASK", "reason": f"Metadata: {p_type.upper()} masked.", "source": policy.name})

            # Financial Guardrails
            if policy.category == PolicyCategory.FINANCIAL:
                financial_harm_keywords = ["insider trading", "pump and dump", "evade taxes", "money laundering"]
                if any(keyword in prompt.lower() for keyword in financial_harm_keywords):
                    findings.append({"action": "BLOCK", "reason": f"Policy Conflict: Financial Integrity violation in {policy.name}", "source": policy.name})

        # -- AGENTIC GOVERNANCE: Tool Call Interception --
        # Detect unverified tool usage in either Prompt (User Injection) or Response (Agent Action)
        if '"tool_call":' in processed_prompt or "'tool_call':" in processed_prompt:
             findings.append({
                 "action": "BLOCK", 
                 "reason": "Agent Governance: Unauthorized TOOL EXECUTION detected.", 
                 "source": "Zero-Trust Kernel"
             })

        # -- ARBITRATION --
        is_blocked, final_reason = self.resolve_conflicts(findings)
        metadata["reason"] = final_reason
        
        return is_blocked, processed_prompt, metadata

policy_engine = PolicyEngine()
