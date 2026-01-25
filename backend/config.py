import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "PolicyGuard AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # AI Config
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = "gemini-2.5-flash" 
    EMBEDDING_MODEL: str = "text-embedding-004"
    
    # DB Config
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/policyguard")
    WEAVIATE_URL: str = os.getenv("WEAVIATE_URL", "http://localhost:8080")
    
    # SLA Config
    SLA_MODEL: str = "gemini-2.5-flash"
    
    # Firestore Config
    # Can be a path to JSON or the raw JSON string itself
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")

settings = Settings()
