from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from app.db.vector_store import get_retriever

class RAGService:
    def __init__(self):
        # 1. Initialize the LLM with the correct, currently supported model
        self.llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

        # 2. Get retrievers for each news source
        self.brazil_retriever = get_retriever("brazil_news")
        self.europe_retriever = get_retriever("europe_news")

        # 3. Define the prompt for the "router"
        self.router_prompt_template = """
        Your job is to classify the user's question into one of two categories based on geography: Brazil or Europe.
        Do not answer the question. Only provide the single word category name.

        Categories: brazil, europe

        User Question: {question}
        Category:
        """
        self.router_prompt = ChatPromptTemplate.from_template(self.router_prompt_template)

        # 4. Create the routing chain
        self.routing_chain = self.router_prompt | self.llm | StrOutputParser()

        # 5. Define the prompt for the final answer generation
        self.final_prompt_template = """
        You are a helpful news assistant. Answer the user's question based only on the following context about news.
        If the context does not contain the answer, state that you don't have enough information.

        Context:
        {context}

        Question:
        {question}

        Answer:
        """
        self.final_prompt = ChatPromptTemplate.from_template(self.final_prompt_template)
    
    def decide_retriever(self, input_dict):
        """
        Runs the routing chain and returns the appropriate retriever object.
        """
        question = input_dict["question"]
        route = self.routing_chain.invoke({"question": question})
        
        print(f"--- Routing decision: {route} ---")

        if "brazil" in route.lower():
            return self.brazil_retriever
        elif "europe" in route.lower():
            return self.europe_retriever
        else:
            return self.brazil_retriever

    def ask_question(self, question: str) -> dict:
        """
        Executes the full RAG pipeline and returns the answer and source documents.
        """
        
        # --- THE FIX IS HERE ---
        # We define a helper function to handle the routing logic cleanly.
        # It takes the input dictionary, picks the retriever, and then invokes it
        # with the QUESTION STRING only.
        def route_and_retrieve(input_dict):
            retriever = self.decide_retriever(input_dict)
            return retriever.invoke(input_dict["question"])

        # We use RunnableLambda to wrap our helper function
        setup_and_retrieval = {
            "context": RunnableLambda(route_and_retrieve),
            "question": RunnablePassthrough()
        }
        # -----------------------

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
        
        # Invoke the chain
        result = full_rag_chain.invoke({"question": question})
        return result

from functools import lru_cache

@lru_cache()
def get_rag_service() -> RAGService:
    return RAGService()