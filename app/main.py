from fastapi import FastAPI, Request
from app.api.routers import chat, auth
from app.core.logging import setup_logging
from app.core.config import settings
import structlog
import time
import uuid
import os

# Setup structured logging
setup_logging()
logger = structlog.get_logger()

# Explicitly set LangChain environment variables for tracing
# LangChain reads these directly from os.environ
os.environ["LANGCHAIN_TRACING_V2"] = settings.LANGCHAIN_TRACING_V2
os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT

# Ensure LANGCHAIN_API_KEY is set (critical for tracing)
# If LANGCHAIN_API_KEY is not already in env (e.g. from k8s), try to use LANGSMITH_API_KEY from settings
if "LANGCHAIN_API_KEY" not in os.environ and settings.LANGSMITH_API_KEY:
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY

os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
os.environ["LANGSMITH_PROJECT"] = settings.LANGCHAIN_PROJECT

logger.info(
    "langsmith_configured",
    project=settings.LANGCHAIN_PROJECT,
    tracing_enabled=settings.LANGCHAIN_TRACING_V2,
    endpoint=settings.LANGCHAIN_ENDPOINT,
    api_key_set=bool(os.environ.get("LANGCHAIN_API_KEY")),
    api_key_length=len(os.environ.get("LANGCHAIN_API_KEY", ""))
)

# Create the FastAPI app instance
app = FastAPI(
    title="NewsBot RAG API",
    description="An API for chatting with recent news from Brazil and Europe.",
    version="1.0.2"
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