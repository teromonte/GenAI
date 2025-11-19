from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from app.db.vector_store import get_retriever

class RAGService:
    def __init__(self):
        # 1. Initialize the LLM
        self.llm = ChatGroq(model="llama3-8b-8192", temperature=0)

        # 2. Get retrievers for each news source
        self.africa_retriever = get_retriever("africa_news")
        self.europe_retriever = get_retriever("europe_news")

        # 3. Define the prompt for the "router" which decides the topic
        self.router_prompt_template = """
        Your job is to classify the user's question into one of two categories based on geography: Africa or Europe.
        Do not answer the question. Only provide the single word category name.

        Categories: africa, europe

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
        Runs the routing chain and returns the appropriate retriever.
        """
        question = input_dict["question"]
        route = self.routing_chain.invoke({"question": question})
        
        print(f"--- Routing decision: {route} ---") # For debugging

        if "africa" in route.lower():
            return self.africa_retriever
        elif "europe" in route.lower():
            return self.europe_retriever
        else:
            # Default to a combined search or a neutral response
            # For this project, we'll just default to one.
            return self.africa_retriever

    def ask_question(self, question: str) -> str:
        """
        Executes the full RAG pipeline: Route -> Retrieve -> Generate.
        """
        # Create the full chain using LangChain Expression Language (LCEL)
        full_rag_chain = (
            {
                "context": self.decide_retriever, # This calls our custom router function
                "question": RunnablePassthrough() # Passes the original question through
            }
            | self.final_prompt
            | self.llm
            | StrOutputParser()
        )
        
        # Invoke the chain with the user's question
        answer = full_rag_chain.invoke(question)
        return answer

# Create a single instance to be used by the API
rag_service = RAGService()