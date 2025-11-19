from fastapi import APIRouter
from app.api.schemas import ChatRequest, ChatResponse, SourceDocument
from app.services.rag_service import rag_service

# Create a new router
router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Receives a question, processes it through the RAG pipeline,
    and returns the answer along with source documents.
    """
    # 1. Call the service (this works now!)
    result = rag_service.ask_question(request.question)
    
    # 2. Extract the raw LangChain documents
    raw_documents = result.get("context", [])
    
    # 3. Convert LangChain Documents -> Pydantic SourceDocuments
    # This is the step that was missing causing the ValidationError
    converted_documents = []
    for doc in raw_documents:
        converted_documents.append(
            SourceDocument(
                page_content=doc.page_content,
                metadata=doc.metadata
            )
        )

    # 4. Return the response matching the Schema
    return ChatResponse(
        answer=result.get("answer", "No answer found."),
        source_documents=converted_documents
    )