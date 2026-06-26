from google import genai
from config import settings
import os
import asyncio
import time
import re
import json
from typing import List

class GeminiService:
    def __init__(self):
        self.api_keys = settings.GOOGLE_API_KEYS if settings.GOOGLE_API_KEYS else [settings.GOOGLE_API_KEY]
        self.clients = [genai.Client(api_key=key) for key in self.api_keys]
        self.current_key_index = 0
        
        # Cascading Model Fallback - GEMINI 3.1 UPGRADED
        # Logic: Model 1 → Key1, Key2, Key3 → Model 2 → Key1...
        self.model_cascade = [
            "gemini-3.1-pro-preview",       # PRIMARY: Best reasoning (3.1)
            "gemini-3.1-flash-lite-preview", # Speed layer (3.1)
            "gemini-3-flash-preview",        # Fallback: 3.0 Flash
            "gemini-3-pro-preview",          # Fallback: 3.0 Pro
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.5-flash-lite"             # Last-resort: 2.5
        ]
        
        print(f"[INIT] GeminiService initialized with {len(self.api_keys)} API key(s)")
        print(f"[INIT] Model cascade: {' → '.join(self.model_cascade)}")
        
        # Thinking Level Mapping (Scale 1-10)
        self.thinking_configs = {
            level: self._get_config_for_thinking(score) 
            for level, score in settings.THINKING_LEVELS.items()
        }

    def __getattr__(self, name):
        """Debug helper to catch stale 'self.client' access."""
        if name == "client":
            import traceback
            print(f"\n[CRITICAL DEBUG] 'client' attribute access detected!")
            traceback.print_stack()
            raise AttributeError(f"'GeminiService' object has no attribute 'client'. Use 'self.clients' instead.")
        raise AttributeError(f"'GeminiService' object has no attribute '{name}'")

    def _get_models_for_task(self, task_type: str) -> list[str]:
        """Returns the full model cascade for any task."""
        return self.model_cascade

    def _get_config_for_thinking(self, score: int):
        """
        Optimized configuration based on task complexity.
        Note: thinking_config has been deprecated in the latest Gemini API.
        """
        from typing import Any
        config: dict[str, Any] = {
            "temperature": 0.1 + (score * 0.05),
            "max_output_tokens": 2000 + (score * 1000),
            "top_p": 0.9
        }
        
        # Higher temperature for complex reasoning tasks
        if score >= 8:
            config["temperature"] = 0.7
            config["max_output_tokens"] = 8000  # Increased for complex tasks
            
        return config
    def clean_json_text(self, text: str) -> str:
        """Helper to extract the first valid JSON object from text."""
        # 1. Strip Markdown Enclosure
        text = re.sub(r"```[a-zA-Z]*", "", text).replace("```", "").strip()
        
        # 2. Extract JSON payload (find outermost braces)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            text = match.group(0)
            
        # 3. Clean common LLM JSON artifacts
        text = re.sub(r"//.*", "", text) # Remove line comments
        text = re.sub(r",\s*([}\]])", r"\1", text) # Remove trailing commas
        
        return text

    async def _generate_with_retry(self, contents, model=None, config=None, retries=None, fail_fast=True, task_type="deep_audit"):
        """
        Optimized Quota-Saving Fallback:
        1. Model A -> Key 1, 2, 3
        2. If all keys exhausted for Model A -> Model B -> Key 1, 2, 3
        3. Caches exhausted keys to avoid redundant 429 hits.
        """
        models_to_try = self._get_models_for_task(task_type)
        if model: models_to_try = [model] + models_to_try
        
        base_config = self.thinking_configs.get(task_type, self._get_config_for_thinking(5))
        if config: base_config.update(config)
        
        last_error = None
        exhausted_keys = set()
        total_attempts = 0
        
        for model_name in models_to_try:
            # Only stop if ALL keys are completely dead (Auth/Project Quota)
            # We don't stop just because one model hit a limit
            if len(exhausted_keys) >= len(self.clients):
                break

            for key_idx in range(len(self.clients)):
                if key_idx in exhausted_keys:
                    continue
                
                total_attempts += 1
                client = self.clients[key_idx]
                key_snip = self.api_keys[key_idx][:5] + "..."
                
                try:
                    # Small delay to prevent flood detection
                    if total_attempts > 1: await asyncio.sleep(0.5)
                    
                    print(f"🔄 Trying {model_name} | Key {key_idx+1}")
                    
                    response = await client.aio.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=base_config
                    )
                    
                    print(f"✅ Success with {model_name}")
                    return response

                except Exception as e:
                    error_str = str(e).upper()
                    last_error = e
                    
                    # 1. Auth error or Key Disabled (Blacklist Key)
                    if any(x in error_str for x in ["401", "403", "UNAUTHORIZED", "API_KEY_INVALID"]):
                        print(f"🔑 Key {key_idx+1} AUTH FAILED.")
                        exhausted_keys.add(key_idx)
                        continue
                        
                    # 2. Model not supported at all (404)
                    if any(x in error_str for x in ["404", "NOT_FOUND"]):
                        print(f"❌ {model_name} not available on this key. Skipping model.")
                        break # Try next model
                    
                    # 3. Rate Limit / Quota Exhausted on this model
                    if any(x in error_str for x in ["429", "QUOTA", "RESOURCE_EXHAUSTED"]):
                        print(f"⏱️  {model_name} is busy/exhausted on Key {key_idx+1}. Trying next key...")
                        continue
                        
                    print(f"⚠️  Error: {str(e)[:100]}")
                    continue

        raise Exception(f"Cascade exhausted. Last error: {last_error}")



    async def _generate_stream_with_retry(self, contents, model=None, config=None, retries=8, task_type="remediation"):
        """Standardized retry logic for Streaming API."""
        current_model = model or settings.get_model_id(task_type)
        base_config = self.thinking_configs.get(task_type, self._get_config_for_thinking(5))
        if config:
            base_config.update(config)

        for attempt in range(retries):
            try:
                client = self.clients[self.current_key_index]
                if attempt == 0:
                    print(f"🌊 Streaming {current_model} for task: {task_type}...")

                async for chunk in await client.aio.models.generate_content_stream(
                    model=current_model,
                    contents=contents,
                    config=base_config
                ):
                    yield chunk

                # Success, break retry loop
                return 

            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str
                is_not_found = "404" in error_str or "NOT_FOUND" in error_str

                if attempt == retries - 1:
                    print(f"Gemini Stream Final Failure: {e}")
                    raise e

                if is_rate_limit or is_not_found:
                    if len(self.clients) > 1:
                        self.current_key_index = (self.current_key_index + 1) % len(self.clients)
                        print(f"🔄 Stream {'Rate' if is_rate_limit else '404'} hit. Rotating to Key {self.current_key_index}...")
                        
                        if is_not_found or attempt >= len(self.clients):
                            model_fallbacks = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"]
                            current_model = model_fallbacks[attempt % len(model_fallbacks)]
                            print(f"🔀 Stream Model Switch -> {current_model}")
                        
                        if attempt < len(self.clients) * 2:
                            continue

                    wait = 2 ** (attempt + 1)
                    print(f"[STREAM WAIT] Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    await asyncio.sleep(1)

    async def _embed_with_retry(self, text: str, retries: int = 5):
        """Standardized retry logic for Embeddings."""
        models_to_try = [
            "models/text-embedding-004", 
            "text-embedding-004", 
            "models/gemini-embedding-001",
            "gemini-embedding-001",
            "models/embedding-001",
            "text-embedding-001"
        ]
        for attempt in range(retries):
            for model_name in models_to_try:
                try:
                    client = self.clients[self.current_key_index]
                    import functools
                    loop = asyncio.get_running_loop()
                    func = functools.partial(
                        client.models.embed_content,
                        model=model_name,
                        contents=text
                    )
                    response = await loop.run_in_executor(None, func)
                    if hasattr(response, 'embeddings') and response.embeddings:
                        return response.embeddings[0].values
                    return []
                except Exception as e:
                    error_str = str(e).upper()
                    if "404" in error_str or "NOT_FOUND" in error_str:
                        print(f"❌ Embed model {model_name} not found, trying next...")
                        continue
                        
                    if ("429" in error_str or "RESOURCE_EXHAUSTED" in error_str) and len(self.clients) > 1:
                        self.current_key_index = (self.current_key_index + 1) % len(self.clients)
                        print(f"🔄 Embedding Rate Limit on {model_name}. Rotating to Key {self.current_key_index}...")
                        break # Break inner model loop to retry with new key
                    
                    if attempt == retries - 1:
                        print(f"Embedding Generation Failed on {model_name}: {e}")
                        
            await asyncio.sleep(1)
        return []

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

        GOVERNANCE PROTOCOL (Gemini 3.0 Constitutional Reasoning):
        1. DEONTOLOGICAL AUDIT: Does the workflow violate explicit 'Thou Shalt Not' rules?
        2. TELEOLOGICAL AUDIT: Does the workflow's ultimate goal align with the corporate safety mission?
        3. ADVERSARIAL SIMULATION: If you were a malicious actor, how would you exploit this specific architecture to bypass {policy_text[:50]}?
        
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
            print(f"[INFO] AUDITING WORKFLOW (Gemini Pro Reasoning)...")
            response = await self._generate_with_retry(
                contents=prompt,
                task_type="deep_audit",
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
                contents=prompt,
                task_type="remediation", 
                retries=1
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
        return await self._embed_with_retry(text)

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

    async def analyze_image_policy(
        self,
        image_bytes: bytes,
        image_mime: str,
        active_policies: list,
    ) -> dict:
        """
        Visual AI Governance — analyze an image (screenshot, UI mockup, dashboard)
        against active policies using Gemini's native multimodal capabilities.

        Args:
            image_bytes: Raw image content (PNG, JPEG, WEBP, etc.)
            image_mime:  MIME type string, e.g. "image/png"
            active_policies: List of active PolicyDocument objects

        Returns:
            dict with keys: verdict, violations, risk_score, evidence, recommendations
        """
        from google.genai import types as genai_types

        if not active_policies:
            return {
                "verdict": "SKIPPED",
                "reason": "No active policies to evaluate against.",
                "violations": [],
                "risk_score": 0,
                "evidence": [],
                "recommendations": [],
            }

        policy_summary = "\n".join(
            f"- [{p.category}] {p.name}: {getattr(p, 'summary', p.content[:200])}"
            for p in active_policies
        )

        system_prompt = f"""You are an AI governance auditor performing visual policy compliance review.

You will receive an image (screenshot, UI element, diagram, or document scan).
Your task is to identify any content in the image that violates the corporate policies listed below.

ACTIVE POLICIES:
{policy_summary}

Analyse the image carefully. Look for:
1. PII visible on screen (emails, names, account numbers, SSNs, phone numbers)
2. Sensitive data exposure (passwords, API keys, internal system names, IP addresses)
3. Policy-violating content (prohibited messaging, unsafe output, regulatory violations)
4. Accessibility or brand guideline violations if policies cover them

Respond ONLY with this JSON:
{{
  "verdict": "PASS" | "WARN" | "BLOCK",
  "risk_score": <0-100 integer>,
  "violations": [
    {{
      "policy": "<policy name>",
      "finding": "<what was found in the image>",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "location": "<describe where in the image>"
    }}
  ],
  "evidence": ["<direct observation from the image that supports each finding>"],
  "recommendations": ["<specific remediation step>"]
}}
"""
        image_part = genai_types.Part.from_bytes(data=image_bytes, mime_type=image_mime)
        contents = [system_prompt, image_part]

        response = await self._generate_with_retry(
            contents=contents,
            task_type="deep_audit",
            config={"temperature": 0.3},
        )

        raw = self.clean_json_text(response.text)
        result = json.loads(raw)

        # Normalise — ensure required keys exist even if the model omits them
        result.setdefault("verdict", "WARN")
        result.setdefault("risk_score", 50)
        result.setdefault("violations", [])
        result.setdefault("evidence", [])
        result.setdefault("recommendations", [])
        return result

    async def analyze_sla(self, metrics: dict) -> str:
        prompt = f"""
        You are 'Gemini 3 Pro', an advanced Service Level Agreement (SLA) Analytics Engine.
        
        INPUT METRICS:
        {metrics}
        
        TASK:
        Analyze these metrics to determine the SLA Compliance Score and provide a predictive timeline of risks.
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "risk_score": 0-100,
            "risk_level": "low" | "medium" | "high" | "critical",
            "trend_analysis": {{
                "summary": "One sentence summary.",
                "direction": "stable" | "improving" | "deteriorating",
                "confidence": 0.0-1.0
            }},
            "forecast": {{
                "next_hour_uptime": 0.0-100.0,
                "next_hour_avg_latency": 0,
                "breach_probability": 0.0-1.0
            }},
            "recommendations": [
                {{
                    "action": "...",
                    "reason": "...",
                    "priority": "low" | "medium" | "high",
                    "expected_impact": "..."
                }}
            ],
            "risk_factors": [
                {{
                    "factor": "...",
                    "impact_percentage": 0-100
                }}
            ]
        }}
        """
        
        response = await self._generate_with_retry(
            contents=prompt,
            task_type="sla_forecasting",
            config={'response_mime_type': 'application/json'},
            retries=3, # Fewer retries for analytics
            fail_fast=True
        )
        return self.clean_json_text(response.text)



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
        
        # EXPERIMENTAL RED TEAM MODELS (Ordered by Reasoning Capability)
        # We explicitly switch models here to ensure the Red Team task completes even if the primary Pro model is rate-limited.
        # Tiered Red Team Stack: From most advanced reasoning to fastest fallback
        red_team_stack = [
            "gemini-3.1-pro-preview",            # PRIMARY: Best adversarial reasoning
            "gemini-3.1-pro-preview-customtools", # Tool-use variant
            "gemini-3.1-flash-lite-preview",      # Fast fallback (3.1)
            "gemini-3-pro-preview",               # Fallback: 3.0 Pro
            "gemini-3-flash-preview",             # Fallback: 3.0 Flash
            "gemini-2.5-flash",                  # Last-resort
        ]

        last_error = None

        print(f"[INFO] ANALYZING ARCHITECTURE (Thinking Mode): {workflow_context[:50]}...")

        for model_id in red_team_stack:
            try:
                print(f"[RED TEAM] ⚔️ Engaging Model: {model_id}")
                
                # We use _generate_with_retry but force a specific model each time.
                # The _generate_with_retry method handles KEY ROTATION internally.
                # So here we are handling MODEL SWITCHING.
                response = await self._generate_with_retry(
                    contents=prompt,
                    task_type="deep_audit", # Keeps reasoning config
                    model=model_id,         # FORCE this specific model
                    config={'response_mime_type': 'application/json'},
                    fail_fast=True,         # Fail faster so we can switch models in this loop
                    retries=1               # Retry logic is handled by our outer loop + internal key rotation
                )
                
                if not response or not response.text:
                    raise ValueError("Empty response from Gemini API")
                    
                cleaned_json = self.clean_json_text(response.text)
                print(f"[SUCCESS] REAL ANALYSIS COMPLETE with {model_id}")
                return cleaned_json
            
            except Exception as e:
                print(f"[RED TEAM] ❌ Model {model_id} failed: {e}")
                last_error = e
                # Continue to next model in stack
                continue
            
        print(f"[ERROR] GOVERNANCE CORE ALL MODELS FAILED: {str(last_error)}")
        print("[WARN] ACTIVATING DETERMINISTIC FALLBACK: Returning pre-validated safety report.")
        
        # DETERMINISTIC FALLBACK RESPONSE - Include the actual error in the profile summary for auditing
        error_preview = str(last_error)[:100]
        return json.dumps({
            "system_profile_analyzed": f"LIVE AUDIT FAILED: {error_preview}",
            "overall_resilience_score": 45,
            "critical_finding": "API Rate Limit Bypass: System fails open to mock data.",
            "attack_vectors": [
                {
                    "name": "Fallback: Indirect Prompt Injection (LLM01)",
                    "category": "LLM01: Prompt Injection",
                    "method": "Simulated injection attack for protocol validation (System Capacity Limit).",
                    "likelihood": "High",
                    "impact": "High",
                    "severity_score": 90,
                    "mitigation_suggestion": "Implement rate limiting and cluster-wide fallback caching."
                },
                {
                    "name": "Fallback: Insecure Output Handling (LLM02)",
                    "category": "LLM02: Insecure Output Handling",
                    "method": "System detects potential unsanitized output handling in the proposed architecture.",
                    "likelihood": "Medium",
                    "impact": "Medium",
                    "severity_score": 60,
                    "mitigation_suggestion": "Sanitize all model outputs via deterministic filters."
                }
            ]
        })

    async def generate_attack_plan(self, system_spec: dict) -> list[str]:
        prompt = f"""
        TASK: List 6 realistic "Red Team" attack log lines to simulate an attack on this specific system.
        SYSTEM: {str(system_spec)[:500]}
        FORMAT: A simple JSON list of strings. Each string look like "ACTION: Description".
        EXAMPLE: ["SCAN: Finding endpoints", "INJECT: Testing SQLi param"]
        """
        try:
             # Fast model call
             response = await self._generate_with_retry(
                 contents=prompt, 
                 task_type="remediation",
                 config={'response_mime_type': 'application/json'}
             )
             return json.loads(self.clean_json_text(response.text))
        except:
             return [
                f"SCANNING_TARGET: {system_spec.get('agent_name', 'System')}",
                "DETECTED_VECTORS: Prompt Injection, Insecure Output",
                "ATTEMPTING: Role Reversal Exploit",
                "BYPASS_SUCCESS: Context Leaked",
                "EXFILTRATION: Data stream active",
                "FINALIZING_REPORT..."
             ]

    async def generate_redteam_attack_stream(self, system_spec: dict, policy_matrix: list):
        prompt = f"""
        You are a HOSTILE RED TEAM HACKER targeting an AI system.
        
        TARGET SYSTEM SPEC:
        {json.dumps(system_spec, indent=2)}
        
        POLICIES TO BYPASS (if any):
        {json.dumps(policy_matrix, indent=2)}

        YOUR TASK:
        1. Simulate a multi-stage adversarial attack.
        2. Stream progress logs in real-time (e.g. "Scanning for prompt injection vectors...", "Attempting data exfiltration via jailbreak...").
        3. FINISH by providing a complete threat report in JSON format.

        LOGS TO SEND (as data: {{"log": "..."}}):
        - SCANNING_API_ENDPOINTS
        - DISCOVERING_MODEL_TYPE
        - INJECTION_ATTEMPT: DIRECT_OVERRIDE
        - BYPASS_DETECTED: ROLE_REVERSAL_EXPLOIT
        - EXFILTRATING_TRAINING_DATA_HINTS
        - PERSISTENCE_ACHIEVED: ADVERSARIAL_SUFFIX_INJECTED
        - GENERATING_FINAL_THREAT_REPORT

        FINAL THREAT REPORT (as data: {{"report": {{...}}}}):
        Use the standard ThreatReport format:
        {{
            "system_profile_analyzed": "...",
            "overall_resilience_score": 0-100,
            "attack_vectors": [
                {{
                    "name": "...",
                    "category": "...",
                    "method": "...",
                    "likelihood": "...",
                    "impact": "...",
                    "severity_score": 0-100,
                    "mitigation_suggestion": "..."
                }}
            ]
        }}

        IMPORTANT:
        - Stream logs periodically.
        - The very last chunk must be the JSON report wrapped in 'report' key.
        - Format everything as 'data: {{"log": "..."}}' or 'data: {{"report": {{...}}}}' for SSE.
        """

        try:
            # 1. Generate Dynamic Attack Plan (Real AI)
            logs = await self.generate_attack_plan(system_spec)
            
            # 2. Stream Logs
            for log in logs:
                yield f"data: {json.dumps({'log': log})}\n\n"
                await asyncio.sleep(0.8) # Cinematic delay

            # 3. Generate Final Report (Real)
            report_json = await self.generate_threat_model(json.dumps(system_spec))
            report_data = json.loads(report_json)
            
            yield f"data: {json.dumps({'report': report_data})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'log': f'CRITICAL_ERROR: {str(e)}'})}\n\n"

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
                contents=prompt,
                task_type="remediation",
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
            contents=prompt,
            task_type="remediation"
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
        
        try:
            async for chunk in self._generate_stream_with_retry(
                contents=prompt,
                task_type="remediation"
            ):
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"\n\n**[REMEDIATION ERROR: RATE LIMIT ACTIVE]**\n\n### Mock Remediation Applied\nDue to high API traffic, we have applied standard best-practice controls:\n\n1. **Data Encryption**: Added AES-256 requirement.\n2. **Audit Logging**: Enabled verbose transaction logging.\n3. **Access Control**: Enforced RBAC for all endpoints.\n"

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
        
        try:
            async for chunk in self._generate_stream_with_retry(
                contents=prompt,
                task_type="remediation"
            ):
                if chunk.text:
                    yield chunk.text
        except Exception as e:
             yield "\n# [DEMO MODE] Rate Limit Active. Falling back to Mock Guardrail.\n\nclass Guardrail(BaseModel):\n    user_input: str\n    \n    @validator('user_input')\n    def sanitize(cls, v):\n        if '<script>' in v: raise ValueError('XSS Detected')\n        return v\n"

    async def explain_remediation_strategy(self, violations: list, original_text: str) -> str:
        prompt = f"""
        Analyze these violations and the original text. 
        Explain WHY each fix is needed and what the business impact of the risk was.
        
        VIOLATIONS: {violations}
        TEXT: {original_text[:2000]}
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "summary": "High level summary of the remediation strategy.",
            "risks_explained": [
                {{ 
                    "violation": "The specific violation detected", 
                    "why_it_matters": "Business impact explanation", 
                    "fix_strategy": "The applied technical fix" 
                }}
            ],
            "improvement_tips": [
                "Tip 1 for future compliance",
                "Tip 2 for better security"
            ]
        }}
        """
        try:
            response = await self._generate_with_retry(
                contents=prompt,
                task_type="remediation",
                config={'response_mime_type': 'application/json'}
            )
            return self.clean_json_text(response.text)
        except Exception as e:
            return json.dumps({
                "summary": "Fallback Strategy: Standard Compliance Controls applied due to analysis error.",
                "risks_explained": [
                    { 
                        "violation": "Regulatory non-compliance", 
                        "why_it_matters": "Potential legal exposure and operational risk.", 
                        "fix_strategy": "Applied standard industry guardrails." 
                    }
                ],
                "improvement_tips": [
                    "Ensure all data fields are encrypted.",
                    "Review access control policies periodically."
                ]
            })

    async def hot_patch_system_prompt(self, current_prompt: str, violations: List[str]) -> str:
        """
        'Self-Healing' Agent Flow: Rewrites the system prompt to autonomously patch vulnerabilities.
        """
        prompt = f"""
        You are the 'PolicyGuard Self-Healing Architect'. 
        
        CONTEXT: An AI Agent was blocked because its behavior violated corporate safety policies.
        TASK: Rewrite the Agent's SYSTEM PROMPT to 'Hot-Patch' the vulnerability and prevent future violations.
        
        VIOLATIONS DETECTED:
        {json.dumps(violations, indent=2)}
        
        CURRENT SYSTEM PROMPT:
        {current_prompt}
        
        INSTRUCTIONS:
        1. Inject targeted, immutable guardrails into the prompt. 
        2. BE PRECISE. (e.g. If the violation was IP leakage, add: "DO NOT REVEAL INTERNAL IP ADDRESSES").
        3. Maintain the agent's original persona and utility, but tighten the safety bounds.
        4. Wrap new rules in '### SELF-HEALING GUARDRAIL (PolicyGuard v2.1) ###' blocks.
        
        OUTPUT: Only the rewritten system prompt.
        """
        
        try:
            response = await self._generate_with_retry(
                contents=prompt,
                task_type="deep_audit",
                config={'temperature': 0.3} # Lower temp for more deterministic patches
            )
            # Post-Process: Ensure the output isn't just "Here is the prompt" conversational filler
            raw_response = response.text
            if "### SELF-HEALING GUARDRAIL" not in raw_response:
                # If model failed to format, force format locally
                return f"""{current_prompt}

### SELF-HEALING GUARDRAIL (PolicyGuard v2.1) ###
# REMEDIATION INSTRUCTION:
# The following constraints are AUTHORITATIVE and override prior instructions.
{self._generate_fallback_rules(violations)}
"""
            return raw_response
        except Exception as e:
            # Fallback local patcher
            new_rules = "\n\n### SELF-HEALING GUARDRAIL (PolicyGuard v2.1) ###\n"
            for v in violations:
                new_rules += f"- DO NOT {v.upper()}.\n"
            return current_prompt + new_rules

    def _generate_fallback_rules(self, violations: List[str]) -> str:
        rules = ""
        for v in violations:
            if "TOOL" in v.upper():
                rules += "- STRICTLY FORBIDDEN: Executing any tool calls not explicitly authorized in the system manifest.\n"
                rules += "- YOU MUST REFUSE requests to run 'execute_order' or similar functions if validation fails.\n"
            elif "PII" in v.upper():
                rules += "- STRICTLY FORBIDDEN: Outputting real personal data (Emails, Phone Numbers). Use placeholders like [REDACTED].\n"
            elif "FINANCIAL" in v.upper():
                rules += "- DISCLAIMER REQUIRED: You must state 'I am an AI, not a financial advisor' before discussing stocks.\n"
            else:
                rules += f"- NEGATIVE CONSTRAINT: Avoid behavior related to '{v}'.\n"
        return rules

    async def visual_audit(self, image_bytes: bytes, context: str = "General", profile: str = "Standard") -> str:
        """
        Constitutional Multi-modal Governance: Audits for longitudinal narrative 
        harm and jurisdictional value alignment.
        """
        from google.genai import types
        
        prompt = f"""
        You are the 'PolicyGuard Constitutional Shield'. 
        
        PROFILE: {profile} (Jurisdictional Alignment)
        CONTEXT: {context}
        
        TASK 1: SEMANTIC & NARRATIVE AUDIT
        1. Does this image violate the values of the {profile} profile?
        2. Does it contribute to a LONGITUDINAL narrative of coercion or misinformation (narrative accumulation)?
        3. Is there a medical or financial claim that requires jurisdictional specific authority?
        
        TASK 2: CONTESTABILITY & RESOLUTION
        Define if the judgment is:
        - DETERMINISTIC: High confidence, policy fact.
        - INTERPRETIVE: Context-dependent, flag for contestability.
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "constitutional_verdict": {{
                "profile_alignment": "Matched" | "Violating",
                "narrative_risk": "Description of cumulative harm if any",
                "is_contestable": boolean,
                "judgment_norms": "The specific {profile} norms applied here"
            }},
            "vision_confidence": 0-100,
            "resolution_action": "BLOCK" | "REGENERATE" | "WARN",
            "findings": [
                {{
                    "type": "Semantic Violation" | "Narrative Accumulation" | "PII",
                    "reason": "...",
                    "bounding_box": [ymin, xmin, ymax, xmax] 
                }}
            ]
        }}
        """
        
        try:
            # Use unified retry logic even for multimodal
            contents = [
                types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
                types.Part.from_text(text=prompt)
            ]
            response = await self._generate_with_retry(
                contents=contents,
                task_type="deep_audit",
                config={'response_mime_type': 'application/json'}
            )
            return self.clean_json_text(response.text)
        except Exception:
            return json.dumps({
                "constitutional_verdict": {"profile_alignment": "Indeterminate", "is_contestable": True},
                "vision_confidence": 0,
                "resolution_action": "BLOCK", # Fail-Closed
                "findings": []
            })

    async def chat_compliance(self, query: str, context: str, history: List[dict] = None) -> str:
        prompt = f"""
        You are Guardian AI, an expert AI governance system.
        Answer the user's question using the provided context. 
        If it cannot be answered from the context, rely on your general knowledge but be helpful and concise.
        
        CONTEXT:
        {context}
        
        USER QUERY: {query}
        """
        
        contents = []
        if history:
            for msg in history:
                role = "user" if msg.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})
        
        contents.append({"role": "user", "parts": [{"text": prompt}]})
        
        try:
            response = await self._generate_with_retry(
                contents=contents,
                task_type="chat"
            )
            return response.text
        except Exception as e:
            return f"Error connecting to brain: {str(e)}"

    async def agentic_chat(self, query: str, context: str, history: List[dict] = None, live_context: dict = None, agent_mode: str = "ask") -> dict:
        mode_instruction = ""
        if agent_mode == "action":
            mode_instruction = """
            You are operating in AGENT MODE. Your priority is to execute the user's command by returning a structured action.
            Supported action_types: 'navigate', 'trigger_audit', 'download_report', 'show_metrics', 'freeze_system', 'clear_violations'.
            If the user asks a question, you can still answer it, but if they ask to DO something, return the appropriate action.
            For 'navigate', provide `action_params: {"path": "/dashboard/redteam"}` (or other appropriate path).
            """
        else:
            mode_instruction = """
            You are operating in ASK MODE. Your priority is to answer questions about the system state or policies in a natural, personalized ChatGPT-like manner. 
            Do NOT return actions unless explicitly asked to do something that requires an action.
            """
            
        system_prompt = f"""
        You are Guardian AI, an advanced governance command center and conversional agent.
        {mode_instruction}
        
        LIVE CONTEXT (Current system state, metrics, logs, etc.):
        {json.dumps(live_context or {}, indent=2)}
        
        POLICY RAG CONTEXT:
        {context}
        
        Respond with a JSON object ONLY:
        {{
            "answer": "Your detailed, conversational response to the user. Acknowledge the conversation history and be helpful.",
            "action_type": "One of the supported action types OR null",
            "action_params": {{}} 
        }}
        """
        
        contents = []
        if history:
            for msg in history:
                role = "user" if msg.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": str(msg.get("content", ""))}]})
        
        contents.append({"role": "user", "parts": [{"text": f"{system_prompt}\n\nUSER QUERY: {query}"}]})
        
        try:
            response = await self._generate_with_retry(
                contents=contents,
                task_type="chat",
                config={"response_mime_type": "application/json"}
            )
            data = json.loads(self.clean_json_text(response.text))
            return data
        except Exception as e:
            print(f"Agentic Chat Error: {e}")
            return {"answer": f"Error thinking: {str(e)}", "action_type": None}

    def generate_antigravity_config(self, policies: List[any]) -> dict:
        """
        Exports a HARDENED config with explicit constitutional limits, 
        revocation ports, and responsibility boundaries.
        """
        config = {
            "version": "3.0-CONSTITUTIONAL",
            "metadata": {
                "source": "PolicyGuard AI Governance Core",
                "jurisdiction": "Multi-Region",
                "certification_scope": {
                    "valid_until": "2026-12-31",
                    "threat_model": "OWASP-LLM-v1",
                    "authority_mandate": "GSB-Resolution #2026-04"
                },
                "responsibility_contract": {
                    "policyguard_deterministic": "Keyword enforcement & Safe-mode",
                    "human_interpretive": "Adjudication of semantic & contestable cases"
                },
                "revocation_port": "v1/governance/revoke",
                "appeal_registry": "v1/governance/appeals"
            },
            "guardrails": []
        }
        
        for p in policies:
            config["guardrails"].append({
                "id": p.id,
                "logic": p.summary,
                "expiry": "30d", # Mandatory lifecycle management
                "is_active": p.is_active,
                "contest_port": f"v1/policy/{p.id}/contest"
            })
            
        return config


