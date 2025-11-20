from unittest.mock import MagicMock, patch
from app.services.rag_service import RAGService

def test_decide_retriever_brazil():
    # Mock the dependencies
    with patch("app.services.rag_service.ChatGroq") as MockGroq, \
         patch("app.services.rag_service.get_retriever") as mock_get_retriever:
        
        # Setup mocks
        mock_llm = MagicMock()
        MockGroq.return_value = mock_llm
        
        # Create service instance
        service = RAGService()
        
        # Mock the routing chain result
        # The chain is router_prompt | llm | StrOutputParser
        # We need to mock the invoke method of the chain
        service.routing_chain = MagicMock()
        service.routing_chain.invoke.return_value = "brazil"
        
        # Test
        retriever = service.decide_retriever({"question": "News about Rio?"})
        
        # Assert
        assert retriever == service.brazil_retriever

def test_decide_retriever_europe():
    with patch("app.services.rag_service.ChatGroq") as MockGroq, \
         patch("app.services.rag_service.get_retriever") as mock_get_retriever:
        
        service = RAGService()
        service.routing_chain = MagicMock()
        service.routing_chain.invoke.return_value = "europe"
        
        retriever = service.decide_retriever({"question": "News about Paris?"})
        
        assert retriever == service.europe_retriever

def test_decide_retriever_default():
    with patch("app.services.rag_service.ChatGroq") as MockGroq, \
         patch("app.services.rag_service.get_retriever") as mock_get_retriever:
        
        service = RAGService()
        service.routing_chain = MagicMock()
        service.routing_chain.invoke.return_value = "unknown"
        
        # Should default to Brazil
        retriever = service.decide_retriever({"question": "Random question"})
        
        assert retriever == service.brazil_retriever
