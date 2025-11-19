from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import ChatRequest, ChatResponse, SourceDocument
# Import Auth and DB dependencies
from app.api.deps import get_current_user 
from app.db.session import get_db
# Import Models for saving history
from app.db.models import User, ChatHistory
# Import RAG Service and its Dependency Provider
from app.services.rag_service import RAGService, get_rag_service 

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    # 1. SECURITY: Ensure user is logged in
    current_user: User = Depends(get_current_user),
    # 2. DATABASE: Get a session to save history
    db: Session = Depends(get_db),
    # 3. LOGIC: Get the RAG Service (using your existing DI)
    service: RAGService = Depends(get_rag_service) 
):
    """
    Receives a question, processes it through the RAG pipeline,
    saves the history to Postgres, and returns the answer.
    """
    
    # A. Get the AI result using the injected service
    result = service.ask_question(request.question)
    answer_text = result.get("answer", "No answer found.")
    
    # B. Save the interaction to the Database
    # We use 'current_user.id' to link this chat to the logged-in user
    history_item = ChatHistory(
        user_id=current_user.id,
        question=request.question,
        answer=answer_text
    )
    db.add(history_item)
    db.commit() # This persists the data to Postgres
    
    # C. Convert Documents (as before)
    raw_documents = result.get("context", [])
    converted_documents = []
    for doc in raw_documents:
        converted_documents.append(
            SourceDocument(
                page_content=doc.page_content,
                metadata=doc.metadata
            )
        )

    # D. Return response
    return ChatResponse(
        answer=answer_text,
        source_documents=converted_documents
    )