"""
Self-Healing Service Module

Orchestrates autonomous AI agent self-healing by:
1. Analyzing vulnerabilities detected in agent responses
2. Generating patched system prompts using Gemini
3. Deploying patches to Stream 2 agents
4. Tracking healing history in Firestore with reliable retry semantics
"""

import httpx
import json
import logging
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
import uuid

from services.gemini import GeminiService
from services.storage import PolicyStorage

logger = logging.getLogger(__name__)


class SelfHealingService:
    def __init__(self):
        self.gemini = GeminiService()
        self.db = PolicyStorage()
    
    def is_self_healing_enabled(self) -> bool:
        """Check if user has enabled self-healing feature"""
        try:
            settings = self.db.get_gatekeeper_settings()
            return settings.get('self_healing_enabled', False)
        except Exception as e:
            print(f"[Self-Healing] Error checking status: {e}")
            return False
    
    async def generate_patch(
        self, 
        agent_id: str,
        current_prompt: str,
        violations: List[str]
    ) -> Dict:
        """
        Generate a patched system prompt using Gemini AI
        
        Args:
            agent_id: Identifier for the agent being patched
            current_prompt: Current system prompt of the agent
            violations: List of detected vulnerabilities
            
        Returns:
            Dict with patched_prompt, analysis, and metadata
        """
        try:
            # Call Gemini to generate patch
            patched_prompt = await self.gemini.hot_patch_system_prompt(
                current_prompt, 
                violations
            )
            
            # Generate healing ID
            healing_id = f"HEAL-{uuid.uuid4().hex[:8].upper()}"
            
            # Create analysis metadata
            analysis = {
                "healing_id": healing_id,
                "agent_id": agent_id,
                "violations_detected": violations,
                "timestamp": datetime.now().isoformat(),
                "status": "patch_generated",
                "patched_prompt": patched_prompt,
                "original_prompt_hash": hash(current_prompt)
            }
            
            return analysis
            
        except Exception as e:
            print(f"[Self-Healing] Patch generation failed: {e}")
            raise Exception(f"Failed to generate patch: {str(e)}")
    
    async def deploy_patch(
        self,
        agent_url: str,
        patched_prompt: str,
        healing_id: str
    ) -> Dict:
        """
        Deploy patched prompt to Stream 2 agent
        
        Args:
            agent_url: Base URL of the Stream 2 agent
            patched_prompt: The patched system prompt to deploy
            healing_id: Unique identifier for this healing operation
            
        Returns:
            Dict with deployment status and details
        """
        try:
            # Construct endpoint URL
            endpoint = f"{agent_url.rstrip('/')}/system/update-prompt"
            
            # Send patch to agent
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    endpoint,
                    json={"system_prompt": patched_prompt},
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = {
                        "healing_id": healing_id,
                        "status": "deployed",
                        "timestamp": datetime.now().isoformat(),
                        "agent_response": response.json(),
                        "success": True
                    }
                else:
                    result = {
                        "healing_id": healing_id,
                        "status": "deployment_failed",
                        "timestamp": datetime.now().isoformat(),
                        "error": f"Agent returned status {response.status_code}",
                        "success": False
                    }
                    
            return result
            
        except httpx.TimeoutException:
            return {
                "healing_id": healing_id,
                "status": "deployment_failed",
                "timestamp": datetime.now().isoformat(),
                "error": "Agent connection timeout",
                "success": False
            }
        except Exception as e:
            print(f"[Self-Healing] Deployment failed: {e}")
            return {
                "healing_id": healing_id,
                "status": "deployment_failed",
                "timestamp": datetime.now().isoformat(),
                "error": str(e),
                "success": False
            }
    
    async def track_healing_history(self, healing_record: Dict):
        """
        Store healing operation in history with exponential-backoff retry and local fallback.
        Never silently swallows failures — every failure is logged at WARNING or ERROR level.
        """
        healing_id = healing_record.get("healing_id", "unknown")
        max_retries = 3
        base_delay = 1.0  # seconds

        for attempt in range(1, max_retries + 1):
            try:
                await self.db.add_healing_record(healing_record)
                logger.info("[Self-Healing] Recorded healing: %s (attempt %d)", healing_id, attempt)
                return
            except Exception as exc:
                if attempt < max_retries:
                    wait = base_delay * (2 ** (attempt - 1))
                    logger.warning(
                        "[Self-Healing] Failed to record healing %s (attempt %d/%d): %s — retrying in %.1fs",
                        healing_id, attempt, max_retries, exc, wait
                    )
                    await asyncio.sleep(wait)
                else:
                    logger.error(
                        "[Self-Healing] All %d attempts to record healing %s failed: %s — writing to local fallback",
                        max_retries, healing_id, exc
                    )
                    await self._write_fallback_record(healing_record)

    async def _write_fallback_record(self, healing_record: Dict):
        """Last-resort: append healing record to a local NDJSON file so no record is ever lost."""
        import os
        fallback_path = os.path.join(os.path.dirname(__file__), "..", "healing_history_fallback.ndjson")
        try:
            healing_record["_fallback"] = True
            healing_record["_fallback_ts"] = datetime.now().isoformat()
            with open(fallback_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(healing_record) + "\n")
            logger.warning("[Self-Healing] Healing record %s written to fallback file: %s", healing_record.get("healing_id"), fallback_path)
        except Exception as fallback_exc:
            logger.error("[Self-Healing] CRITICAL: fallback write also failed for %s: %s", healing_record.get("healing_id"), fallback_exc)
    
    async def get_healing_history(self, limit: int = 20) -> List[Dict]:
        """
        Retrieve recent healing operations
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            List of healing records, newest first
        """
        try:
            return await self.db.get_healing_history(limit)
        except Exception as e:
            print(f"[Self-Healing] Failed to retrieve history: {e}")
            return []
    
    async def test_agent_endpoint(self, agent_url: str) -> Dict:
        """
        Test if Stream 2 agent has self-healing endpoint implemented
        
        Args:
            agent_url: Base URL of the Stream 2 agent
            
        Returns:
            Dict with test results
        """
        try:
            endpoint = f"{agent_url.rstrip('/')}/system/update-prompt"
            
            # Send test payload
            test_prompt = "TEST_PROMPT_DO_NOT_APPLY"
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    endpoint,
                    json={"system_prompt": test_prompt},
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "message": "Self-healing endpoint is ready",
                        "agent_response": response.json()
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Endpoint returned status {response.status_code}",
                        "details": response.text[:200]
                    }
                    
        except httpx.TimeoutException:
            return {
                "success": False,
                "message": "Connection timeout - agent may not be running"
            }
        except httpx.ConnectError:
            return {
                "success": False,
                "message": "Cannot connect to agent - check URL and ensure agent is running"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Test failed: {str(e)}"
            }


# Global instance
self_healing_service = SelfHealingService()
