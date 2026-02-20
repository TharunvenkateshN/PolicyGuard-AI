import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load .env file explicitly
load_dotenv()
from typing import Dict

class Settings(BaseModel):
    PROJECT_NAME: str = "Lexinel"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # AI Config - Separation of Roles
    GOOGLE_API_KEYS: list[str] = [k.strip() for k in os.getenv("GOOGLE_API_KEYS", "").split(",") if k.strip()]
    GOOGLE_API_KEY: str = GOOGLE_API_KEYS[0] if GOOGLE_API_KEYS else os.getenv("GOOGLE_API_KEY", "")
    
    # Model Configuration - Updated for Quota Availability
    MODEL_FLASH: str = os.getenv("MODEL_FLASH", "gemini-2.5-flash")
    MODEL_PRO: str = os.getenv("MODEL_PRO", "gemini-1.5-pro") 
    
    # Unified Fallbacks
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", MODEL_FLASH)
    SLA_MODEL: str = os.getenv("SLA_MODEL", MODEL_PRO)
    
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-004")
    
    # Thinking Levels (1-10)
    THINKING_LEVELS: Dict[str, int] = {
        "inline_filter": 2,    # Minimal reasoning, priority on speed
        "remediation": 6,      # Moderate reasoning
        "deep_audit": 9,       # High reasoning
        "sla_forecasting": 8   # Accurate pattern analysis
    }
    
    # Governance Targets
    DEFAULT_SLA_UPTIME: float = 99.9
    DEFAULT_PII_BLOCK_LEVEL: str = "strict" # strict | warn | log
    
    # DB Config (Keep existing for compatibility)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lexinel.db")
    USE_FIREBASE: bool = os.getenv("USE_FIREBASE", "true").lower() == "true"
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")

    # Right Model for the Right Task (Model ID Switcher)
    def get_model_id(self, task: str) -> str:
        """
        Architectural Intelligence: Selects model based on task complexity.
        Inline proxy uses Flash for latency; Deep Audits use Pro for reasoning.
        """
        task_complexity = self.THINKING_LEVELS.get(task, 5)
        
        if task_complexity >= 8:
            return self.MODEL_PRO
        return self.MODEL_FLASH

settings = Settings()
