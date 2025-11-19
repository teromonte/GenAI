from pydantic import BaseModel
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