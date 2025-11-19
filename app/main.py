from fastapi import FastAPI
from app.api.routers import chat, auth 

# Create the FastAPI app instance
app = FastAPI(
    title="NewsBot RAG API",
    description="An API for chatting with recent news from Africa and Europe.",
    version="1.0.0"
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])

@app.get("/", tags=["Root"])
async def read_root():
    """
    A simple root endpoint to confirm the API is running.
    """
    return {"message": "Welcome to the NewsBot RAG API!"}