from google import genai
from config import settings
import os

class GeminiService:
    def __init__(self):
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found in environment variables. Please check your .env file.")
        
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        
    async def analyze_policy_conflict(self, policy_text: str, workflow_desc: str) -> str:
        prompt = f"""
        You are PolicyGuard AI, a Senior AI Governance Auditor & Legal Compliance Specialist.

        YOUR GOAL:
        Conduct a rigorous forensic audit of the PROPOSED AI WORKFLOW against the CORPORATE POLICIES.
        You must identify explicitly where the workflow violates specific legal or policy requirements.

        INPUT CONTEXT:

        --- CORPORATE POLICY DOCUMENT ---
        {policy_text}

        --- PROPOSED AI WORKFLOW (USER INPUT) ---
        {workflow_desc}

        --- AUDITOR INSTRUCTIONS ---
        1. **System Inference**: Deduce the full technical architecture from the user's description.
        2. **Legal Mapping**: For every policy clause, check if the workflow explicitly or implicitly contradicts it.
        3. **Evidence Extraction**: You MUST quote the exact line/section from the Policy and the exact part of the Workflow that conflicts.
        4. **Severity Scoring**:
           - **High**: Illegal, blocks deployment (e.g., GDPR violation, unencrypted secrets).
           - **Medium**: Risky, requires mitigation (e.g., missing logging, weak auth).
           - **Low**: Best practice violation.
        5. **Verdict**: If ANY "High" severity issues are found, status must be "Not Approved".

        OUTPUT FORMAT (Strict JSON, no markdown):
        {{
            "system_spec": {{
                "summary": "Technical summary of the inferred system.",
                "primary_purpose": "...",
                "decision_authority": "Human vs AI",
                "automation_level": "Fully/Semi/None",
                "deployment_stage": "Prototype/Prod",
                "geographic_exposure": ["US", "EU", "Global"]
            }},
            "data_map": {{
                "data_categories_detected": ["PII", "Financial", "Health"],
                "data_flow_source": "User Upload/API",
                "data_storage_retention": "Inferred retention policy",
                "cross_border_transfer": "Yes/No (and where)"
            }},
            "policy_matrix": [
                {{
                    "policy_area": "e.g. Data Residency",
                    "status": "Compliant" | "Non-Compliant" | "At Risk" | "Cannot Be Assessed",
                    "reason": "Short reason"
                }}
            ],
            "risk_assessment": {{
                "overall_score": 0-100, #(0=Critical fail, 100=Perfect)
                "overall_rating": "High" | "Medium" | "Low",
                "breakdown": {{
                    "Regulatory": "High/Medium/Low",
                    "User Harm": "High/Medium/Low",
                    "Reputational": "High/Medium/Low"
                }},
                "confidence_score": "High"
            }},
            "evidence": [
                {{
                    "source_doc": "Policy vs Workflow",
                    "policy_section": "Section 2.1: Key Management",
                    "workflow_component": "Prompt Template",
                    "issue_description": "User is hardcoding API keys in the prompt text.",
                    "severity": "High",
                    "snippet": "Exact quote from input causing the issue"
                }}
            ],
            "recommendations": [
                {{
                    "title": "Actionable Title",
                    "type": "Blocking" | "Advisory",
                    "description": "What to do to fix it.",
                    "related_policy": "Policy Name"
                }}
            ],
            "verdict": {{
                "approved": boolean,
                "status_label": "Approved" | "Rejected",
                "approval_conditions": ["List of conditions"]
            }}
        }}
        """
        
        # New SDK usage
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        return response.text

    async def summarize_policy(self, text: str) -> str:
        prompt = f"Summarize the following corporate policy in one concise sentence (max 20 words). Focus on what is restricted:\n\n{text[:5000]}"
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt
        )
        return response.text
