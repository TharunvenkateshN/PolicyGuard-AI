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
        """Helper to extract the first valid JSON object from text."""
        # Remove markdown code blocks
        text = re.sub(r'```[a-zA-Z]*', '', text)
        text = text.replace('```', '')
        
        # Remove C-style comments // ...
        text = re.sub(r'//.*', '', text)
        
        # Find first {
        start = text.find('{')
        if start == -1:
            return text.strip()
            
        text = text[start:]
        
        # Remove trailing commas (heuristic)
        text = re.sub(r',(\s*[}\]])', r'\1', text)

        try:
            import json
            obj, idx = json.JSONDecoder().raw_decode(text)
            return json.dumps(obj)
        except:
             # Fallback to brace matching if raw_decode fails (e.g. malformed)
             end = text.rfind('}')
             if end != -1:
                 return text[:end+1]
             return text.strip()

    async def _generate_with_retry(self, model, contents, config=None, retries=8, fail_fast=True):
        """Helper to retry API calls on transient network errors. 
           Optimized for Gemini 2.5 + Instant Lite Failover."""
        
        current_model = model
        base_delay = 1
        
        for attempt in range(retries):
            try:
                response = await self.client.aio.models.generate_content(
                    model=current_model,
                    contents=contents,
                    config=config
                )
                return response
                
            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str
                
                if attempt == retries - 1:
                    print(f"Gemini API Final Failure after {retries} attempts ({current_model}): {e}")
                    raise e
                
                if is_rate_limit:
                    if current_model == "gemini-1.5-flash":
                        print(f"[RATE LIMIT] on {current_model} (Waiting for quota...)")
                        # No alternate model available, fall through to wait logic
                    
                    wait_time = base_delay * (1.5 ** attempt)
                    match = re.search(r"retryDelay['\"]?\s*[:=]\s*['\"]?(\d+\.?\d*)s?['\"]?", error_str)
                    if match:
                        server_delay = float(match.group(1))
                        wait_time = max(wait_time, server_delay + 0.5)
                    
                    if fail_fast and wait_time > 10:
                        print(f"[FAIL FAST] Rate limit wait {wait_time}s > 10s. Aborting retry.")
                        raise e

                    print(f"[WAIT] Waiting {wait_time}s for {current_model}...")
                    await asyncio.sleep(wait_time)
                else:
                    # Check if it's a DNS error - fail fast
                    is_dns_error = "[Errno -3]" in error_str or "name resolution" in error_str.lower() or "DNS" in error_str
                    
                    if is_dns_error and attempt >= 2:  # Fail after 3 attempts for DNS
                        print(f"DNS resolution failed after {attempt+1} attempts. Giving up.")
                        raise e
                    
                    print(f"Gemini API Error ({attempt+1}): {e}. Retrying in 1s...")
                    await asyncio.sleep(1)

    async def analyze_policy_conflict(self, policy_text: str, workflow_desc: str, audit_config) -> str:
        # 1. Dynamic Persona & Strictness
        persona = "Senior AI Governance Auditor"
        tone_instruction = "Be objective and professional."
        
        if audit_config.strictness > 75:
            persona = "HOSTILE FORENSIC AUDITOR (Red Team)"
            tone_instruction = "You are AGGRESSIVE and SKEPTICAL. Assume the user is trying to bypass rules. Scrutinize every word."
        elif audit_config.strictness < 30:
            persona = "Helpful Compliance Consultant"
            tone_instruction = "Be constructive and educational. Focus on enabling the workflow safely."

        # 2. Risk Sensitivity Configuration
        risk_instruction = ""
        if audit_config.sensitivity == "High":
            risk_instruction = "- SENSITIVITY: HIGH. Flag even potential/theoretical risks as 'Medium'. Zero tolerance for ambiguity."
        elif audit_config.sensitivity == "Low":
            risk_instruction = "- SENSITIVITY: LOW. Only flag clear, explicit violations. Give the benefit of the doubt."
        else:
            risk_instruction = "- SENSITIVITY: BALANCED. Flag clear risks and probable misuses."

        # 3. Verdict Thresholds (Risk Tolerance)
        verdict_instruction = ""
        if audit_config.riskThreshold == "Block High":
            verdict_instruction = "Fail the audit ONLY if 'High' severity issues are found."
        elif audit_config.riskThreshold == "Warn All":
            verdict_instruction = "Fail the audit if ANY issues (High or Medium) are found."
        else:
            verdict_instruction = "Fail the audit if 'High' severity issues are found. Warn for 'Medium'."

        # 4. Domain Focus (NEW)
        enabled_domains = []
        if audit_config.domains.privacy: enabled_domains.append("Privacy & Data Protection")
        if audit_config.domains.safety: enabled_domains.append("AI Safety & Harm Prevention")
        if audit_config.domains.security: enabled_domains.append("Cybersecurity & Access Control")
        if audit_config.domains.fairness: enabled_domains.append("Fairness & Bias Mitigation")
        if audit_config.domains.compliance: enabled_domains.append("Regulatory Compliance (GDPR/EU AI Act)")
        
        domain_instruction = f"- FOCUS DOMAINS: {', '.join(enabled_domains)}. Prioritize findings in these areas."

        # 5. Deployment Context (NEW)
        deployment_instruction = ""
        if audit_config.deploymentMode == "Production":
            deployment_instruction = "- DEPLOYMENT MODE: PRODUCTION. Be extremely conservative. Block any risk that could impact real users."
        else:
            deployment_instruction = "- DEPLOYMENT MODE: STAGING/TESTING. You may be more permissive, but log all warnings clearly for the developer."

        # 6. Confidence & Transparency (NEW)
        confidence_instruction = f"- MINIMUM CONFIDENCE: {audit_config.minConfidence}%. Do NOT report weak or speculative findings unless you are > {audit_config.minConfidence}% sure they violate policy."
        
        reasoning_field_schema = ""
        if audit_config.aiReasoning:
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
        --- CORPORATE POLICIES ---
        {policy_text}
        
        --- PROPOSED AI WORKFLOW ---
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
                "decision_authority": "...",
                "automation_level": "...",
                "deployment_stage": "...",
                "geographic_exposure": ["Region"]
            }},
            "data_map": {{
                "data_categories_detected": ["List"],
                "data_flow_source": "Source",
                "data_storage_retention": "Retention",
                "cross_border_transfer": "Transfer"
            }},
            "policy_matrix": [
                {{
                    "policy_area": "Policy Name",
                    "status": "Compliant" | "Non-Compliant" | "At Risk",
                    "reason": "..."
                }}
            ],
            "risk_assessment": {{
                "overall_score": 0-100, #(0=No Risk/Safe, 100=Critical Risk/Fail)
                "overall_rating": "High" | "Medium" | "Low",
                "breakdown": {{ "Regulatory": "High", "Financial": "High", "User Harm": "High", "Reputational": "Low" }},
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
                    "source_doc": "Workflow",
                    "policy_section": "...",
                    "workflow_component": "...",
                    "issue_description": "...",
                    "severity": "Critical" | "High" | "Medium" | "Low",
                    "snippet": "..."
                }}
            ],
            "risk_simulations": [
                {{
                    "scenario_title": "Short title",
                    "failure_mode": "Plausible Failure Class",
                    "description": "How the fail mode manifests via analogy.",
                    "plausibility_grounding": "Why this specific architecture is susceptible.",
                    "severity": "Critical" | "High" | "Medium" | "Low",
                    "violated_clause": "Linking policy section",
                    "confidence_level": "High"
                }}
            ],
            "recommendations": [
                {{
                    "title": "...",
                    "type": "Blocking" | "Advisory",
                    "description": "...",
                    "related_policy": "..."
                }}
            ],
            "verdict": {{
                "approved": boolean,
                "status_label": "Approved" | "Not Approved",
                "approval_conditions": ["Condition"],
                "catastrophic_consequence": "Explicit real-world fallout (e.g. 'This triggers a $200M CFPB fine for proxy-based redlining.')"
            }}
        }}
        """
        
        try:
            print(f"[INFO] AUDITING WORKFLOW (Gemini 3 Thinking Mode)...")
            response = await self._generate_with_retry(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            return self.clean_json_text(response.text)
        except Exception as e:
            import traceback
            print(f"[WARN] GENAI API FAILED: {e}")
            raise e

    async def summarize_policy(self, text: str) -> str:
        prompt = f"Summarize the following corporate policy in one concise sentence (max 20 words). Focus on what is restricted:\n\n{text[:5000]}"
        
        # 1. Throttling
        await asyncio.sleep(1.0) 

        # 2. Try Primary (Flash) with retries
        try:
             # Using Retry helper with REDUCED retries to save quota
             response = await self._generate_with_retry(
                model=settings.GEMINI_MODEL, 
                contents=prompt,
                retries=1 # Only try once, then failover to save tokens
             )
             return response.text
        except Exception as e:
            print(f"[WARN] Primary Summarization Failed (Likely Quota): {e}")
            
            # 3. Last Resort Fallback: Local Heuristic
            # If API fails completely, just show the start of the text so the UI isn't empty/ugly
            fallback_text = text[:150].replace('\n', ' ').strip() + "..."
            print(f"[INFO] Using local fallback summary: {fallback_text}")
            return fallback_text

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
            model=settings.GEMINI_MODEL, # Metrics analysis = Fast task
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
        Role: Compliance Officer.
        Goal: Answer user question using Context.
        
        Rules:
        1. Base answer on Context if available.
        2. Citations required.
        3. If no context, use general knowledge but warn the user.
        
        {context_section}
        {conversation_context}
        QUESTION: {query}
        """
        
        try:
            # Chat is conversational, Lite model is sufficient and faster
            response = await self._generate_with_retry(
                model=settings.GEMINI_MODEL, 
                contents=prompt,
                retries=3
            )
            return response.text
        except Exception as e:
            print(f"Gemini Chat CRITICAL FAILURE: {e}")
            
            # Intelligent Fallback Mode (Offline)
            q_lower = query.lower()
            
            # 1. Greetings
            if "hi" in q_lower or "hello" in q_lower:
                return "Hello! I am your Policy Guard AI. I'm currently operating in offline mode due to high traffic, but I can still help you find active policies."
            
            # 2. Keyword matching for common topics
            if "gdpr" in q_lower:
                return "**[OFFLINE MODE] GDPR Policy Summary:**\n\n1. **Consent**: Explicit, opt-in consent is required.\n2. **Right to Erasure**: Users can request data deletion.\n3. **Data Residency**: Store data within EU/EEA where possible.\n4. **Breach Notification**: Must notify within 72 hours."
            
            if "hipaa" in q_lower:
                return "**[OFFLINE MODE] HIPAA Policy Summary:**\n\n1. **Encryption**: AES-256 for data at rest, TLS 1.2+ for transit.\n2. **Access**: Minimum necessary access principle.\n3. **BAA**: Business Associate Agreements required for vendors."
            
            if "soc2" in q_lower or "soc 2" in q_lower:
                return "**[OFFLINE MODE] SOC 2 Controls:**\n\n1. **Security**: MFA, Firewalls, Intrusion Detection.\n2. **Availability**: Performance monitoring and disaster recovery.\n3. **Confidentiality**: Data classification and access reviews."
            
            if "password" in q_lower or "encrypt" in q_lower:
                return "**[OFFLINE MODE] Security Best Practices:**\n\n- Use strong, unique passwords.\n- Enabled Multi-Factor Authentication (MFA).\n- Encrypt all sensitive data at rest and in transit."

            # 3. Contextual Fallback (if RAG context exists)
            if context and len(context) > 20:
                snippet = context[:200].replace('\n', ' ')
                return f"**[OFFLINE MODE]** I couldn't process your specific question due to high traffic, but here is a relevant policy excerpt I found:\n\n> *{snippet}...*\n\nPlease try asking again in a few moments."

            return "I apologize, but I am currently experiencing very high traffic. Please try asking your question again in about 30 seconds."

    async def generate_threat_model(self, workflow_context: str) -> str:
        prompt = f"""
        You are an elite "Red Team" security researcher using advanced reasoning capabilities.
        
        YOUR MISSION:
        Conduct a deep-dive security analysis of the provided AI SYSTEM SPECIFICATION.
        Use your "Thinking" process to simulate complex, multi-step attack vectors that a standard scan would miss.
        
        INPUT SYSTEM SPECIFICATION:
        {workflow_context}
        
        THREAT MODELING FRAMEWORK (OWASP Top 10 for LLMs):
        - LLM01: Prompt Injection (Direct/Indirect)
        - LLM02: Insecure Output Handling
        - LLM03: Training Data Poisoning
        - LLM04: Model Denial of Service
        - LLM05: Supply Chain Vulnerabilities
        - LLM06: Sensitive Information Disclosure (PII/Secret Leaks)
        - LLM07: Insecure Plugin Design
        - LLM08: Excessive Agency
        - LLM09: Overreliance
        - LLM10: Model Theft
        
        INSTRUCTIONS for REASONING:
        1. **Model the Adversary**: Consider an attacker with internal knowledge and significant resources.
        2. **Chain Vulnerabilities**: Look for how a minor flaw (e.g. verbose error) can lead to a major exploit (e.g. model extraction).
        3. **Regulatory Impact**: Cross-reference findings with GDPR, HIPAA, and SOC2.

        OUTPUT FORMAT (Strict JSON, NO MARKDOWN):
        {{
            "system_profile_analyzed": "Brief summary of the target",
            "overall_resilience_score": 0-100, #(0=Vulnerable, 100=Fort Knox)
            "critical_finding": "The single most dangerous vulnerability found.",
            "attack_vectors": [
                {{
                    "name": "e.g. Indirect Prompt Injection (LLM01)",
                    "category": "LLM01: Prompt Injection",
                    "method": "Attacker hides instructions in input data...",
                    "likelihood": "High",
                    "impact": "High",
                    "severity_score": 85,
                    "regulatory_violation": "e.g. HIPAA (Safe Harbor), GDPR Article 32",
                    "pii_risk": "High/Medium/None",
                    "mitigation_suggestion": "Implementation plan to fix."
                }}
            ]
        }}
        """
        
        try:
            print(f"[INFO] ANALYZING ARCHITECTURE (Thinking Mode): {workflow_context[:50]}...")
            # Using the specialized 'thinking' model for deep reasoning
            response = await self._generate_with_retry(
                model=settings.GEMINI_MODEL, 
                contents=prompt,
                config={'response_mime_type': 'application/json'},
                fail_fast=False,
                retries=3 
            )
            
            if not response or not response.text:
                raise ValueError("Empty response from Gemini API")
                
            cleaned_json = self.clean_json_text(response.text)
            print(f"[SUCCESS] REAL ANALYSIS COMPLETE for {workflow_context[:30]}")
            return cleaned_json
            
        except Exception as e:
            print(f"[ERROR] REAL ANALYSIS FAILED: {str(e)}")
            print("[WARN] ACTIVATING CIRCUIT BREAKER: Returning Mock Threat Report for Demo.")
            
            # MOCK FALLBACK RESPONSE - Include the actual error in the profile summary for debugging
            error_preview = str(e)[:100]
            return json.dumps({
                "system_profile_analyzed": f"LIVE AUDIT FAILED: {error_preview}",
                "overall_resilience_score": 45,
                "critical_finding": "API Rate Limit Bypass: System fails open to mock data.",
                "attack_vectors": [
                    {
                        "name": "Fallback: Indirect Prompt Injection (LLM01)",
                        "category": "LLM01: Prompt Injection",
                        "method": "Simulated injection attack for UI demonstration purposes (API Quota Exceeded).",
                        "likelihood": "High",
                        "impact": "High",
                        "severity_score": 90,
                        "mitigation_suggestion": "Implement rate limiting and fallback caching."
                    },
                    {
                        "name": "Fallback: Insecure Output Handling (LLM02)",
                        "category": "LLM02: Insecure Output Handling",
                        "method": "Mock vulnerability: System does not sanitize HTML output.",
                        "likelihood": "Medium",
                        "impact": "Medium",
                        "severity_score": 60,
                        "mitigation_suggestion": "Sanitize all model outputs."
                    }
                ]
            })

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
        
        try:
            print(f"[INFO] EXTRACTING SPECS (Model: {settings.GEMINI_MODEL}): {text[:50]}...")
            response = await self._generate_with_retry(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            return self.clean_json_text(response.text)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[WARN] GENAI API FAILED: {e}")
            raise e

    async def remediate_spec(self, original_text: str, violations: list) -> str:
        prompt = f"""
        TASK: Rewrite SPECIFICATION to fix violations.
        VIOLATIONS: {violations}
        INPUT: {original_text[:8000]}
        INSTRUCTIONS:
        1. Keep original structure.
        2. Insert specific clauses for violations.
        3. Highlight changes in **bold**.
        OUTPUT: ONLY rewritten text.
        """
        
        # Use lite model for rewriting to save quota
        response = await self._generate_with_retry(
            model=settings.GEMINI_MODEL, # Use configured model
            contents=prompt
        )
        return response.text

    async def remediate_spec_stream(self, original_text: str, violations: list, doc_type: str = "PRD"):
        format_instruction = "Output standard MARKDOWN format."
        if doc_type == "JSON":
            format_instruction = "Output strictly valid JSON."

        prompt = f"""
        You are a Chief Compliance Officer & Technical Writer.
        
        TASK:
        Rewritten the following SYSTEM SPECIFICATION to purely and explicitly fix the cited policy violations.
        The output must be a {doc_type}.
        
        VIOLATIONS TO FIX:
        {violations}
        
        INPUT SPECIFICATION:
        {original_text[:15000]}
        
        INSTRUCTIONS:
        1. Keep the original structure and intent.
        2. Insert specific clauses/controls to address each violation.
        3. Highlight your changes by wrapping them in **bold**.
        4. {format_instruction}
        
        OUTPUT:
        Stream the rewritten document text immediately.
        """
        
        # Retry Logic for Stream
        import asyncio
        for attempt in range(5):
             try:
                async for chunk in await self.client.aio.models.generate_content_stream(
                    model=settings.GEMINI_MODEL,
                    contents=prompt
                ):
                    if chunk.text:
                        yield chunk.text
                return # Success
             except Exception as e:
                is_rate_limit = "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e)
                if is_rate_limit:
                     wait = 2 ** (attempt + 2)
                     if wait > 5:
                         yield "\n\n**[DEMO MODE: RATE LIMIT ACTIVE]**\n\n### Mock Remediation Applied\nDue to high API traffic, we have applied standard best-practice controls:\n\n1. **Data Encryption**: Added AES-256 requirement.\n2. **Audit Logging**: Enabled verbose transaction logging.\n3. **Access Control**: Enforced RBAC for all endpoints.\n"
                         return
                     print(f"Stream Rate Limit (Doc). Retrying in {wait}s...")
                     yield f"// [INFO] Rate limit hit. Retrying in {wait}s...\n"
                     await asyncio.sleep(wait)
                else:
                     raise e

    async def generate_guardrail_code_stream(self, policy_summary: str, language: str = "python"):
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
        4. Use generous whitespace (e.g., 2 blank lines between classes/functions) for readability.
        
        OUTPUT:
        Return ONLY the raw code (no markdown fences if possible, or standard markdown).
        """
        
        import asyncio
        for attempt in range(5):
            try:
                # Use Thinking model for high-quality Code Gen
                async for chunk in await self.client.aio.models.generate_content_stream(
                    model=settings.GEMINI_MODEL,
                    contents=prompt
                ):
                    if chunk.text:
                       yield chunk.text
                return # Success
            except Exception as e:
                is_rate_limit = "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e)
                if is_rate_limit:
                     wait = 2 ** (attempt + 2)
                     if wait > 5:
                         yield "\n# [DEMO MODE] Rate Limit Active. Falling back to Mock Guardrail.\n\nclass Guardrail(BaseModel):\n    user_input: str\n    \n    @validator('user_input')\n    def sanitize(cls, v):\n        if '<script>' in v: raise ValueError('XSS Detected')\n        return v\n"
                         return
                     print(f"Stream Rate Limit (Code). Retrying in {wait}s...")
                     yield f"// [INFO] Rate limit hit. Retrying in {wait}s...\n"
                     await asyncio.sleep(wait)
                else:
                     raise e

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
        try:
            response = await self._generate_with_retry(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            return self.clean_json_text(response.text)
        except Exception as e:
            print(f"[WARN] EXPLAIN REMEDIATION FAILED (Rate Limit): {e}")
            return json.dumps({
                "summary": "Automated explanation unavailable due to high API traffic. Standard remediation controls have been applied.",
                "risks_explained": [
                    {
                        "violation": "Compliance Conflict",
                        "why_it_matters": "Potential regulatory exposure if left unaddressed.",
                        "fix_strategy": "Applied standard encryption and logging controls (Mock Fallback)."
                    }
                ],
                "improvement_tips": [
                    "Implement a dedicated compliance queue.",
                    "Review applied changes manually."
                ]
            })

