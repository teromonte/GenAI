from typing import List, Optional
from langchain_chroma import Chroma
from langchain_core.documents import Document
from app.core.config import settings
from app.db.vector_store import get_embedding_function, get_retriever
import structlog

logger = structlog.get_logger()

class VectorService:
    def __init__(self, collection_name: str = "articles"):
        self.collection_name = collection_name
        self.embedding_function = get_embedding_function()
        self.vector_db = Chroma(
            collection_name=collection_name,
            persist_directory=settings.CHROMA_PATH,
            embedding_function=self.embedding_function,
        )

    def add_documents(self, documents: List[Document]):
        """
        Adds documents to the vector store.
        """
        if documents:
            self.vector_db.add_documents(documents)
            logger.info("documents_added", count=len(documents), collection=self.collection_name)

    def get_retriever(self):
        """
        Returns a retriever for the current collection.
        """
        return self.vector_db.as_retriever()

    async def ainvoke_retriever(self, query: str):
        """
        Asynchronously invokes the retriever.
        """
        retriever = self.get_retriever()
        return await retriever.ainvoke(query)
