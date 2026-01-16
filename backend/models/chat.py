from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    answer: str
    citations: List[str] = []
