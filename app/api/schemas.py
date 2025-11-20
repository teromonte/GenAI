from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any

# Pydantic model for a single source document
class SourceDocument(BaseModel):
    page_content: str
    metadata: Dict[str, Any]

# Pydantic model for the incoming request from the user
class ChatRequest(BaseModel):
    question: str

# Pydantic model for the outgoing response from the API
class ChatResponse(BaseModel):
    answer: str
    source_documents: List[SourceDocument]

# --- Auth Schemas ---

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    
    class Config:
        from_attributes = True # Allows Pydantic to read SQLAlchemy models

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatHistoryOut(BaseModel):
    id: int
    question: str
    answer: str
    timestamp: Any

    class Config:
        from_attributes = True