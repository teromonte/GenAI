from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langsmith import traceable
from app.db.vector_store import get_retriever
from app.core.config import settings

class RAGService:
    def __init__(self):
        # 1. Initialize the LLM
        self.llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

        # 2. Get retriever for the dynamic articles collection
        self.articles_retriever = get_retriever("articles")

        # 3. Load prompts from config
        prompts = settings.get_prompts()
        self.final_prompt_template = prompts["final_prompt_template"]
        self.final_prompt = ChatPromptTemplate.from_template(self.final_prompt_template)

    @traceable
    async def ask_question(self, question: str) -> dict:
        """
        Executes the RAG pipeline using the articles collection.
        """
        # Simple RAG: Retrieve -> Generate
        docs = await self.articles_retriever.ainvoke(question)
        
        generation_chain = (
            self.final_prompt
            | self.llm
            | StrOutputParser()
        )
        
        input_data = {"context": docs, "question": question}
        answer = await generation_chain.ainvoke(input_data)
        
        return {
            "answer": answer,
            "context": docs
        }

    @traceable(project_name="newsbot-rag")
    async def ask_question_stream(self, question: str):
        """
        Streams the answer for the given question.
        """
        docs = await self.articles_retriever.ainvoke(question)
        input_data = {"context": docs, "question": question}
        
        generation_chain = (
            self.final_prompt
            | self.llm
            | StrOutputParser()
        )
        
        async for chunk in generation_chain.astream(input_data):
            yield chunk, docs

    @traceable
    async def generate_article(self, topic: str, category: str = None) -> str:
        """
        Generates a new article based on the topic and optional category.
        """
        # 1. Retrieve relevant articles
        # Note: Chroma retriever doesn't easily support dynamic metadata filtering via invoke param 
        # without using the underlying vector store directly. 
        # For now, we'll retrieve based on topic.
        docs = await self.articles_retriever.ainvoke(topic)
        
        # 2. Generate Article
        article_prompt = ChatPromptTemplate.from_template(
            """You are an expert journalist. Write a comprehensive and engaging article about "{topic}" based on the following source information.
            
            Sources:
            {context}
            
            The article should have a catchy title, a clear introduction, body paragraphs with specific details, and a conclusion.
            Format the output in Markdown.
            """
        )
        
        chain = article_prompt | self.llm | StrOutputParser()
        return await chain.ainvoke({"topic": topic, "context": docs})

from functools import lru_cache

@lru_cache()
def get_rag_service() -> RAGService:
    return RAGService()