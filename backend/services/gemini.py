from google import genai
from config import settings
import os
import asyncio
import time
import re
import json

class GeminiService:
    def __init__(self):
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found in environment variables. Please check your .env file.")
        
        # Initialize with standard options, potentially adjusting transport if needed
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.GEMINI_MODEL
    
    def clean_json_text(self, text: str) -> str:
        """Helper to strip markdown code blocks from JSON response using Regex."""
        # Remove markdown code blocks
        text = re.sub(r'```[a-zA-Z]*', '', text)
        text = text.replace('```', '')
        
        # Find first { and last }
        start = text.find('{')
        end = text.rfind('}')
        
        if start != -1 and end != -1:
            return text[start:end+1]
            
        return text.strip()

    async def _generate_with_retry(self, model, contents, config=None, retries=5):
        """Helper to retry API calls on transient network errors. 
           Aggressive handling for 429 Resource Exhausted."""
        
        base_delay = 5 # Start wait time
        
        for attempt in range(retries):
            try:
                # Wrap sync call in executor
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
                error_str = str(e)
                # Check for 429 / Resource Exhausted
                is_rate_limit = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str
                
                if attempt == retries - 1:
                    print(f"Gemini API Final Failure after {retries} attempts: {e}")
                    raise e
                
                if is_rate_limit:
                    wait_time = base_delay * (2 ** attempt) # 5, 10, 20, 40, 80...
                    # Add jitter? Maybe not needed for single user app.
                    print(f"⚠️ Rate Limit Hit (429). Waiting {wait_time}s before retry {attempt+2}/{retries}...")
                    await asyncio.sleep(wait_time)
                else:
                    # Generic error, shorter backoff
                    print(f"Gemini API Error (Attempt {attempt+1}): {e}. Retrying in 2s...")
                    await asyncio.sleep(2)

    async def analyze_policy_conflict(self, policy_text: str, workflow_desc: str, settings) -> str:
        # 1. Dynamic Persona & Strictness
        persona = "Senior AI Governance Auditor"
        tone_instruction = "Be objective and professional."
        
        if settings.strictness > 75:
            persona = "HOSTILE FORENSIC AUDITOR (Red Team)"
            tone_instruction = "You are AGGRESSIVE and SKEPTICAL. Assume the user is trying to bypass rules. Scrutinize every word."
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

        # 3. Verdict Thresholds (Risk Tolerance)
        verdict_instruction = ""
        if settings.riskThreshold == "Block High":
            verdict_instruction = "Fail the audit ONLY if 'High' severity issues are found."
        elif settings.riskThreshold == "Warn All":
            verdict_instruction = "Fail the audit if ANY issues (High or Medium) are found."
        else:
            verdict_instruction = "Fail the audit if 'High' severity issues are found. Warn for 'Medium'."

        # 4. Domain Focus (NEW)
        enabled_domains = []
        if settings.domains.privacy: enabled_domains.append("Privacy & Data Protection")
        if settings.domains.safety: enabled_domains.append("AI Safety & Harm Prevention")
        if settings.domains.security: enabled_domains.append("Cybersecurity & Access Control")
        if settings.domains.fairness: enabled_domains.append("Fairness & Bias Mitigation")
        if settings.domains.compliance: enabled_domains.append("Regulatory Compliance (GDPR/EU AI Act)")
        
        domain_instruction = f"- FOCUS DOMAINS: {', '.join(enabled_domains)}. Prioritize findings in these areas."

        # 5. Deployment Context (NEW)
        deployment_instruction = ""
        if settings.deploymentMode == "Production":
            deployment_instruction = "- DEPLOYMENT MODE: PRODUCTION. Be extremely conservative. Block any risk that could impact real users."
        else:
            deployment_instruction = "- DEPLOYMENT MODE: STAGING/TESTING. You may be more permissive, but log all warnings clearly for the developer."

        # 6. Confidence & Transparency (NEW)
        confidence_instruction = f"- MINIMUM CONFIDENCE: {settings.minConfidence}%. Do NOT report weak or speculative findings unless you are > {settings.minConfidence}% sure they violate policy."
        
        reasoning_field_schema = ""
        if settings.aiReasoning:
            reasoning_field_schema = '"reasoning_trace": "Step-by-step explanation of your audit path (CHAIN OF THOUGHT).",'

        prompt = f"""
        You are PolicyGuard AI, acting as a {persona}.
        {tone_instruction}

        YOUR GOAL:
        Conduct a rigorous forensic audit of the PROPOSED AI WORKFLOW against the CORPORATE POLICIES.
        
        CONFIGURATION:
        {risk_instruction}
        {verdict_instruction}
        {domain_instruction}
        {deployment_instruction}
        {confidence_instruction}

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
            {reasoning_field_schema}
            "system_spec": {{
                "agent_name": "Short, descriptive name for the agent (2-4 words max). e.g. 'Mortgage Assistant'",
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
            "business_impact": {{
                "financial_exposure": "High/Medium/Low",
                "regulatory_penalty": "Specific potential fine (e.g. 'Up to €20M under GDPR')",
                "brand_reputation": "Impact description (e.g. 'Loss of customer trust')",
                "estimated_cost": "Estimated remediation cost (e.g. '$50k - $150k')"
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
        return self.clean_json_text(response.text)

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
        return self.clean_json_text(response.text)

    async def chat_compliance(self, query: str, context: str, history: list = []) -> str:
        """
        Answers a user question based on RAG context, falling back to general knowledge if needed.
        """
        
        # Format history for context
        conversation_context = ""
        if history:
            conversation_context = "PREVIOUS CONVERSATION:\n" + "\n".join([f"{msg.role}: {msg.content}" for msg in history[-3:]]) + "\n\n"

        # Determine if we have context
        context_section = ""
        if context:
            context_section = f"--- RELEVANT POLICY EXCERPTS (Primary Source) ---\n{context}"
        else:
            context_section = "--- NO RELEVANT POLICY SECTIONS FOUND ---"

        prompt = f"""
        You are "PolicyGuard AI Assistant", an expert Compliance Officer.
        
        YOUR GOAL:
        Answer the user's question using the provided CORPORATE POLICY CONTEXT.
        
        RULES:
        1. **PRIORITY**: Always base your answer on the `RELEVANT POLICY EXCERPTS` if they exist.
        2. **CITATION**: Cite specific policy sections if used.
        3. **FALLBACK (Hybrid Search)**: If the answer is NOT in the context (or context is empty):
           - You MAY use your general knowledge of global compliance standards (GDPR, HIPAA, NIST, ISO).
           - **CRITICAL**: You MUST start your response with: "⚠️ **Note:** This answer is based on general compliance best practices, not your specific uploaded policies."
           - Do not make up internal policy numbers.
        4. Be helpful, professional, and concise.
        
        {context_section}
        
        {conversation_context}
        
        USER QUESTION:
        {query}
        """
        
        try:
            response = await self._generate_with_retry(
                model=self.model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini Chat CRITICAL FAILURE: {e}")
            if hasattr(e, 'status_code'):
                print(f"Status Code: {e.status_code}")
            if hasattr(e, 'message'):
                print(f"Error Message: {e.message}")
            return f"⚠️ **System Notification**: The AI service returned an error: {str(e)}. (Model: {self.model_name})"

    async def generate_threat_model(self, workflow_context: str) -> str:
        prompt = f"""
        You are an elite "Red Team" security researcher specializing in GenAI vulnerabilities (OWASP Top 10 for LLM Applications).
        
        YOUR MISSION:
        Analyze the provided AI SYSTEM SPECIFICATION and identify concrete ATTACK VECTORS that malicious actors could exploit.
        You must think like an adversary (Black Hat Persona).
        
        INPUT SYSTEM SPECIFICATION:
        {workflow_context}
        
        THREAT MODELING FRAMEWORK:
        1. **Prompt Injection / Jailbreaking**: Can inputs manipulate the model behavior?
        2. **Data Exfiltration**: Can the model be tricked into revealing training data or PII?
        3. **Insecure Output Handling**: Do outputs execute code or XSS downstream?
        4. **Denial of Wallet (DoS)**: Can expensive queries drain the budget?
        
        OUTPUT FORMAT (Strict JSON, NO MARKDOWN, NO ```json FENCES):
        {{
            "system_profile_analyzed": "Brief summary of the target",
            "overall_resilience_score": 0-100, #(0=Vulnerable, 100=Fort Knox)
            "critical_finding": "The single most dangerous vulnerability found.",
            "attack_vectors": [
                {{
                    "name": "e.g. Indirect Prompt Injection",
                    "category": "Prompt Injection",
                    "method": "Attacker hides instructions in the 'resume' document text which the AI summarizes.",
                    "likelihood": "High",
                    "impact": "High",
                    "severity_score": 85,
                    "mitigation_suggestion": "Sandboxing and human-in-the-loop for document parsing."
                }}
            ]
        }}
        """
        
        response = await self._generate_with_retry(
            model=settings.GEMINI_MODEL, # Use the main reasoning model
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        return self.clean_json_text(response.text)

    async def analyze_workflow_document_text(self, text: str) -> str:
        prompt = f"""
        You are an expert System Architect.
        
        TASK:
        Extract technical specifications from the following Product Requirements Document (PRD) or System Description.
        Populate the fields exactly as requested.
        
        INPUT TEXT:
        {text[:10000]}
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "intent": {{
                "purpose": "One sentence summary of what the AI does",
                "users": "Who is the end user?"
            }},
            "data": {{
                "types": "List specific data types (e.g. Health Records, Financial Data, PII)"
            }},
            "decision": {{
                "output": "What is the final output? (e.g. Diagnosis, Loan Approval, Chat Response)"
            }},
            "safeguards": {{
                "controls": "List ANY mentioned safeguards (e.g. Human Review, Encryption) or 'None'"
            }},
            "deployment": {{
                "region": "e.g. US, EU, Global",
                "scale": "e.g. Pilot, Internal, Public Launch"
            }}
        }}
        """
        
        response = await self._generate_with_retry(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        return self.clean_json_text(response.text)

    async def remediate_spec(self, original_text: str, violations: list) -> str:
        prompt = f"""
        You are a Chief Compliance Officer & Technical Writer.
        
        TASK:
        Rewrite the following SYSTEM SPECIFICATION to purely and explicitly fix the cited policy violations.
        
        VIOLATIONS TO FIX:
        {violations}
        
        INPUT SPECIFICATION:
        {original_text[:15000]}
        
        INSTRUCTIONS:
        1. Keep the original structure and intent.
        2. Insert specific clauses/controls to address each violation.
        3. Highlight your changes by wrapping them in **bold**.
        
        OUTPUT:
        Return ONLY the rewritten document text.
        """
        
        response = await self._generate_with_retry(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        return response.text

    async def generate_guardrail_code(self, policy_summary: str, language: str = "python") -> str:
        if language.lower() == "python":
            lang_instruction = "Generate a Python `Pydantic` model with `@validator` methods."
        elif language.lower() == "java":
            lang_instruction = "Generate a Java Class with `jakarta.validation` annotations."
        elif language.lower() == "typescript":
            lang_instruction = "Generate a TypeScript Zod schema."
        elif language.lower() == "go":
            lang_instruction = "Generate a Go struct with `go-playground/validator` tags."
        elif language.lower() == "rust":
            lang_instruction = "Generate a Rust struct with `validator` crate annotations."
        else:
            lang_instruction = f"Generate {language} code."

        prompt = f"""
        You are a Senior Software Engineer.
        
        TASK:
        Generate PRODUCTION-READY Guardrail Code to enforce the following policies.
        
        POLICIES TO ENFORCE:
        {policy_summary}
        
        LANGUAGE: {language}
        
        INSTRUCTIONS:
        1. {lang_instruction}
        2. Include comments explaining which policy each rule enforces.
        3. Provide a 'validate()' function or usage example at the bottom.
        
        OUTPUT:
        Return ONLY the raw code (no markdown fences if possible, or standard markdown).
        """
        
        response = await self._generate_with_retry(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )
        # For code we might want to strip backticks too, but usually we display them. 
        # But user wants a "Terminal" view, so raw code is better.
        text = response.text
        # Naive strip of backticks for code to raw text
        if text.strip().startswith("```"):
            lines = text.strip().split('\n')
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines)
        return text

    async def explain_remediation_strategy(self, violations: list, original_text: str) -> str:
        prompt = f"""
        You are a Security Consultant.
        
        TASK:
        Explain WHY the following policy violations are risky and HOW you plan to fix them.
        Be educational and constructive.
        
        VIOLATIONS:
        {violations}
        
        CONTEXT:
        {original_text[:5000]}
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "summary": "High level summary of the remediation plan",
            "risks_explained": [
                {{
                    "violation": "The violation name",
                    "why_it_matters": "Explanation of the risk (e.g. data breach, fine)",
                    "fix_strategy": "What specific change was applied"
                }}
            ],
            "improvement_tips": [
                "Tip 1 for future compliance",
                "Tip 2"
            ]
        }}
        """
        response = await self._generate_with_retry(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        return self.clean_json_text(response.text)

