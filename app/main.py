from fastapi import FastAPI, Request
from app.api.routers import chat, auth
from app.core.logging import setup_logging
import structlog
import time
import uuid

# Setup structured logging
setup_logging()
logger = structlog.get_logger()

# Create the FastAPI app instance
app = FastAPI(
    title="NewsBot RAG API",
    description="An API for chatting with recent news from Brazil and Europe.",
    version="1.0.0"
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    structlog.contextvars.bind_contextvars(request_id=request_id)
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        "request_processed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time=process_time,
    )
    return response

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])

@app.get("/", tags=["Root"])
async def read_root():
    """
    A simple root endpoint to confirm the API is running.
    """
    return {"message": "Welcome to the NewsBot RAG API!"}