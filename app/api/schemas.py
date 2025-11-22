from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any

# Pydantic model for a single source document
class SourceDocument(BaseModel):
    page_content: str
    metadata: Dict[str, Any]

# Pydantic model for the incoming request from the user
class ChatRequest(BaseModel):
    question: str
    history_id: int | None = None

# Pydantic model for the outgoing response from the API
class ChatResponse(BaseModel):
    answer: str
    source_documents: List[SourceDocument]
    history_id: int

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
# --- Feed & Article Schemas ---

class FeedCreate(BaseModel):
    name: str
    url: str
    category: str = 'General'

class FeedOut(FeedCreate):
    id: int
    is_active: int
    last_fetched: Any

    class Config:
        from_attributes = True

class ArticleOut(BaseModel):
    id: int
    title: str
    content: str
    url: str
    published_date: Any
    created_at: Any
    feed_id: int

    class Config:
        from_attributes = True

class GenerateArticleRequest(BaseModel):
    topic: str
    category: str | None = None
    feed_ids: List[int] | None = None

