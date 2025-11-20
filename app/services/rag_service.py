from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from app.db.vector_store import get_retriever
from app.core.config import settings

class RAGService:
    def __init__(self):
        # 1. Initialize the LLM with the correct, currently supported model
        self.llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

        # 2. Get retrievers for each news source
        self.brazil_retriever = get_retriever("brazil_news")
        self.europe_retriever = get_retriever("europe_news")

        # 3. Load prompts from config
        prompts = settings.get_prompts()
        self.router_prompt_template = prompts["router_prompt_template"]
        self.final_prompt_template = prompts["final_prompt_template"]

        self.router_prompt = ChatPromptTemplate.from_template(self.router_prompt_template)
        self.final_prompt = ChatPromptTemplate.from_template(self.final_prompt_template)

        # 4. Create the routing chain
        self.routing_chain = self.router_prompt | self.llm | StrOutputParser()

    async def decide_retriever(self, input_dict):
        """
        Runs the routing chain and returns the appropriate retriever object.
        """
        question = input_dict["question"]
        route = await self.routing_chain.ainvoke({"question": question})
        
        print(f"--- Routing decision: {route} ---")

        if "brazil" in route.lower():
            return self.brazil_retriever
        elif "europe" in route.lower():
            return self.europe_retriever
        else:
            return self.brazil_retriever

    async def ask_question(self, question: str) -> dict:
        """
        Executes the full RAG pipeline and returns the answer and source documents.
        """
        
        # We define a helper function to handle the routing logic cleanly.
        # It takes the input dictionary, picks the retriever, and then invokes it
        # with the QUESTION STRING only.
        async def route_and_retrieve(input_dict):
            retriever = await self.decide_retriever(input_dict)
            # Retrievers in LangChain are usually sync or have ainvoke.
            # Chroma retriever supports ainvoke.
            return await retriever.ainvoke(input_dict["question"])

        # We use RunnableLambda to wrap our helper function
        setup_and_retrieval = {
            "context": RunnableLambda(route_and_retrieve),
            "question": RunnablePassthrough()
        }

        # The part of the chain that generates the answer
        generation_chain = (
            self.final_prompt
            | self.llm
            | StrOutputParser()
        )

        # The full RAG chain
        full_rag_chain = setup_and_retrieval | RunnablePassthrough.assign(
            answer=generation_chain
        )
        
        # Invoke the chain asynchronously
        print(f"[DEBUG] About to invoke LangChain RAG chain for question: {question}")
        result = await full_rag_chain.ainvoke({"question": question})
        print(f"[DEBUG] LangChain RAG chain completed. Result keys: {result.keys()}")
        return result

from functools import lru_cache

@lru_cache()
def get_rag_service() -> RAGService:
    return RAGService()