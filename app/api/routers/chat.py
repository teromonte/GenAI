from fastapi import APIRouter, Depends # Import Depends
from app.api.schemas import ChatRequest, ChatResponse, SourceDocument
from app.services.rag_service import RAGService, get_rag_service # Import the class and the provider

router = APIRouter()

# Inject the service into the function arguments
@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest, 
    service: RAGService = Depends(get_rag_service) # <--- THIS IS DEPENDENCY INJECTION
):
    """
    FastAPI will call get_rag_service(), take the result, 
    and pass it to the 'service' variable.
    """
    # Now we use the injected 'service' variable, not the global import
    result = service.ask_question(request.question)
    
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