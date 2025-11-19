from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings

def get_retriever(collection_name: str):
    """
    Creates and returns a retriever for a specific ChromaDB collection.
    """
    # Initialize the embedding function using the name from settings
    embedding_function = HuggingFaceEmbeddings(
        model_name=settings.EMBEDDING_MODEL_NAME
    )

    # Initialize ChromaDB from the persistent directory
    db = Chroma(
        collection_name=collection_name,
        persist_directory=settings.CHROMA_PATH,
        embedding_function=embedding_function,
    )

    # Create a retriever from the ChromaDB instance
    retriever = db.as_retriever()
    
    return retriever