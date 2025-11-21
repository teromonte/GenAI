from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import structlog

from app.api.schemas import ChatRequest, ChatResponse, SourceDocument, ChatHistoryOut
# Import Auth and DB dependencies
from app.api.deps import get_current_user 
from app.db.session import get_db
# Import Models for saving history
from app.db.models import User, ChatHistory
# Import RAG Service and its Dependency Provider
from app.services.rag_service import RAGService, get_rag_service 

router = APIRouter()
logger = structlog.get_logger()

def _upsert_history(
    db: Session,
    user_id: int,
    question: str,
    answer: str,
    history_id: int | None = None,
) -> ChatHistory:
    history_item = None
    if history_id:
        history_item = (
            db.query(ChatHistory)
            .filter(ChatHistory.id == history_id, ChatHistory.user_id == user_id)
            .first()
        )

    if history_item:
        history_item.question = question
        history_item.answer = answer
        history_item.timestamp = datetime.utcnow()
    else:
        history_item = ChatHistory(
            user_id=user_id,
            question=question,
            answer=answer,
            timestamp=datetime.utcnow(),
        )
        db.add(history_item)

    db.commit()
    db.refresh(history_item)
    return history_item

def _get_or_create_history_stub(
    db: Session,
    user_id: int,
    question: str,
    history_id: int | None = None,
) -> ChatHistory:
    history_item = None
    if history_id:
        history_item = (
            db.query(ChatHistory)
            .filter(ChatHistory.id == history_id, ChatHistory.user_id == user_id)
            .first()
        )

    if history_item:
        history_item.question = question
        history_item.timestamp = datetime.utcnow()
        db.commit()
        db.refresh(history_item)
        return history_item

    history_item = ChatHistory(
        user_id=user_id,
        question=question,
        answer="",
        timestamp=datetime.utcnow(),
    )
    db.add(history_item)
    db.commit()
    db.refresh(history_item)
    return history_item

@router.post("/", response_model=ChatResponse)
@router.post("/chat", response_model=ChatResponse, include_in_schema=False)
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
    try:
        # A. Get the AI result using the injected service
        result = await service.ask_question(request.question)
        answer_text = result.get("answer", "No answer found.")
        
        # B. Save or update the interaction to the Database
        history_item = _upsert_history(
            db=db,
            user_id=current_user.id,
            question=request.question,
            answer=answer_text,
            history_id=request.history_id,
        )
        
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
            source_documents=converted_documents,
            history_id=history_item.id,
        )

    except Exception as e:
        logger.error("chat_endpoint_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/stream")
@router.post("/chat/stream", include_in_schema=False)
async def chat_stream_endpoint(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    service: RAGService = Depends(get_rag_service)
):
    history_item = _get_or_create_history_stub(
        db=db,
        user_id=current_user.id,
        question=request.question,
        history_id=request.history_id,
    )

    async def generate():
        full_answer = ""
        docs = []
        try:
            async for chunk, retrieved_docs in service.ask_question_stream(request.question):
                if retrieved_docs:
                    docs = retrieved_docs
                if chunk:
                    full_answer += chunk
                    yield chunk
            
            # Save history after streaming is done
            history_item.answer = full_answer
            history_item.timestamp = datetime.utcnow()
            db.add(history_item)
            db.commit()
            db.refresh(history_item)
            
        except Exception as e:
            logger.error("stream_error", error=str(e))
            yield f"Error: {str(e)}"

    response = StreamingResponse(generate(), media_type="text/plain")
    response.headers["X-History-Id"] = str(history_item.id)
    return response

@router.get("/history", response_model=list[ChatHistoryOut])
def get_chat_history(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    offset: int = 0,
    limit: int = 50
):
    """
    Get the chat history for the current user with pagination.
    """
    # Get total count for pagination
    total_count = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).count()
    
    # Get paginated history
    history = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).order_by(ChatHistory.timestamp.desc()).offset(offset).limit(limit).all()
    
    # Add total count to response headers
    response.headers["X-Total-Count"] = str(total_count)
    
    return history

@router.delete("/history/{history_id}", status_code=204)
def delete_chat_history(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific chat history item.
    Only the owner can delete their own history.
    """
    # Find the history item
    history_item = db.query(ChatHistory).filter(
        ChatHistory.id == history_id,
        ChatHistory.user_id == current_user.id
    ).first()
    
    if not history_item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    # Delete the item
    db.delete(history_item)
    db.commit()
    
    return Response(status_code=204)