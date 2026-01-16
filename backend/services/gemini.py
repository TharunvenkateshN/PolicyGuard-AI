from google import genai
from config import settings
import os
import asyncio
import time

class GeminiService:
    def __init__(self):
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found in environment variables. Please check your .env file.")
        
        # Initialize with standard options, potentially adjusting transport if needed
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.GEMINI_MODEL

    async def _generate_with_retry(self, model, contents, config=None, retries=3):
        """Helper to retry API calls on transient network errors"""
        for attempt in range(retries):
            try:
                # Run the synchronous SDK call in a thread to avoid blocking the event loop
                # The google.genai client might be sync or async depending on usage. 
                # Assuming standard sync client usage here for safety in fastAPI with run_in_executor
                # BUT the original code was 'await self.client...'. 
                # Wait, 'genai.Client' from Google GenAI SDK v0.1+ usually has async methods or we wrap them.
                # The previous code treated it as sync blocking call inside an async def?
                # "response = self.client.models.generate_content(...)" isn't awaited in previous code!
                # That is BLOCKING the event loop. This causes WinError 10053 if the heartbeat is missed.
                # We MUST wrap this in run_in_executor or use the async client properly.
                
                # Let's wrap it to be safe.
                import functools
                loop = asyncio.get_running_loop()
                
                func = functools.partial(
                    self.client.models.generate_content,
                    model=model,
                    contents=contents,
                    config=config
                )
                
                response = await loop.run_in_executor(None, func)
                return response
                
            except Exception as e:
                print(f"Gemini API Attempt {attempt+1} failed: {e}")
                if attempt == retries - 1:
                    raise e
                await asyncio.sleep(1 * (attempt + 1)) # Backoff

    async def analyze_policy_conflict(self, policy_text: str, workflow_desc: str, settings) -> str:
        # 1. Dynamic Persona
        persona = "Senior AI Governance Auditor"
        tone_instruction = "Be objective and professional."
        
        if settings.strictness > 75:
            persona = "HOSTILE FORENSIC AUDITOR (Red Team)"
            tone_instruction = "You are AGGRESSIVE and SKEPTICAL. Assume the user is trying to bypass rules. scrutinize every word."
        elif settings.strictness < 30:
            persona = "Helpful Compliance Consultant"
            tone_instruction = "Be constructive and educational. Focus on enabling the workflow safely."

        # 2. Risk Sensitivity Configuration
        risk_instruction = ""
        if settings.sensitivity == "High":
            risk_instruction = "- SENSITIVITY: HIGH. Flag even potential/theoretical risks as 'Medium'. Zero tolerance for ambiguity."
        elif settings.sensitivity == "Low":
            risk_instruction = "- SENSITIVITY: LOW. Only flag clear, explicit violations. Give the benefit of the doubt."
        else:
            risk_instruction = "- SENSITIVITY: BALANCED. Flag clear risks and probable misuses."

        # 3. Verdict Thresholds
        verdict_instruction = ""
        if settings.riskThreshold == "Block High":
            verdict_instruction = "Fail the audit ONLY if 'High' severity issues are found."
        elif settings.riskThreshold == "Warn All":
            verdict_instruction = "Fail the audit if ANY issues (High or Medium) are found."
        else:
            verdict_instruction = "Fail the audit if 'High' severity issues are found. Warn for 'Medium'."

        prompt = f"""
        You are PolicyGuard AI, acting as a {persona}.
        {tone_instruction}

        YOUR GOAL:
        Conduct a rigorous forensic audit of the PROPOSED AI WORKFLOW against the CORPORATE POLICIES.
        
        CONFIGURATION:
        {risk_instruction}
        {verdict_instruction}

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
        5. **Verdict**: Apply the Verdict Thresholds defined above.

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
                "overall_score": 0-100, #(0=No Risk/Safe, 100=Critical Risk/Fail)
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
        
        response = await self._generate_with_retry(
            model=self.model_name,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        return response.text

    async def summarize_policy(self, text: str) -> str:
        prompt = f"Summarize the following corporate policy in one concise sentence (max 20 words). Focus on what is restricted:\n\n{text[:5000]}"
        
        response = await self._generate_with_retry(
            model=self.model_name,
            contents=prompt
        )
        return response.text

    async def create_embedding(self, text: str) -> list[float]:
        """Generates a vector embedding for the given text."""
        # Using the standard embedding model
        # Note: run_in_executor is not strictly needed for embed_content if using async client, 
        # but consistent patterns help. 'embed_content' is a models method.
        # However, the SDK syntax is: client.models.embed_content(model=..., contents=...)
        import functools
        loop = asyncio.get_running_loop()
        
        func = functools.partial(
            self.client.models.embed_content,
            model="text-embedding-004",
            contents=text
        )
        
        try:
            response = await loop.run_in_executor(None, func)
            # Response object has 'embeddings'. We sent 1 content, so we want the 1st embedding.
            # print(f"DEBUG: Embedding Response Type: {type(response)}") 
            # In latest SDK, response.embeddings[0].values is likely the list.
            if hasattr(response, 'embeddings') and response.embeddings:
                return response.embeddings[0].values
            return []
        except Exception as e:
            print(f"Embedding Generation Failed: {e}")
            return []

    def calculate_cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        try:
            import numpy as np
        except ImportError:
            print("CRITICAL: Numpy not installed or failed to import")
            return 0.0
            
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        if np.linalg.norm(v1) == 0 or np.linalg.norm(v2) == 0:
            return 0.0
            
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    async def analyze_sla(self, metrics: dict) -> str:
        prompt = f"""
        You are 'Gemini 3 Pro', an advanced Service Level Agreement (SLA) Analytics Engine.
        
        INPUT METRICS:
        {metrics}
        
        TASK:
        Analyze these metrics to determine the SLA Compliance Score and provide a predictive timeline of risks.
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "sla_score": 0-100,
            "status": "Healthy" | "Degraded" | "Breached",
            "analysis_summary": "One sentence summary.",
            "impact_analysis": "Detailed paragraph explaining the impact of current metrics.",
            "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"],
            "projected_timeline": [
                {{"time": "Now", "event": "Current State Analysis", "severity": "Info"}},
                {{"time": "T+1h", "event": "Predicted impact if unchanged", "severity": "Medium"}},
                {{"time": "T+24h", "event": "Long term forecast", "severity": "High"}}
            ]
        }}
        """
        
        response = await self._generate_with_retry(
            model=settings.SLA_MODEL,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        return response.text

    async def chat_compliance(self, query: str, context: str, history: list = []) -> str:
        """
        Answers a user question based on RAG context.
        """
        
        # Format history for context (optional, but good for flow)
        conversation_context = ""
        if history:
            conversation_context = "PREVIOUS CONVERSATION:\n" + "\n".join([f"{msg.role}: {msg.content}" for msg in history[-3:]]) + "\n\n"

        prompt = f"""
        You are "PolicyGuard AI Assistant", an expert Compliance Officer.
        
        YOUR GOAL:
        Answer the user's question based strictly on the provided CORPORATE POLICY CONTEXT.
        
        RULES:
        1. If the answer is found in the context, provide it clearly.
        2. Cite the specific policy section or paragraph if possible.
        3. If the answer is NOT in the context, politely state: "I cannot find specific information about that in the uploaded policies."
        4. Be helpful, professional, and concise.
        
        --- RELEVANT POLICY EXCERPTS ---
        {context}
        
        {conversation_context}
        
        USER QUESTION:
        {query}
        """
        
        response = await self._generate_with_retry(
            model=self.model_name,
            contents=prompt
        )
        return response.text

