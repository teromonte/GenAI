import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.rag_service import RAGService

@pytest.mark.asyncio
async def test_decide_retriever_brazil():
    # Mock the dependencies
    with patch("app.services.rag_service.ChatGroq") as MockGroq, \
         patch("app.services.rag_service.get_retriever") as mock_get_retriever, \
         patch("app.services.rag_service.settings") as mock_settings:
        
        # Setup mocks
        mock_llm = MagicMock()
        MockGroq.return_value = mock_llm
        
        mock_settings.get_prompts.return_value = {
            "router_prompt_template": "router",
            "final_prompt_template": "final"
        }
        
        # Create service instance
        service = RAGService()
        
        # Mock the routing chain result
        service.routing_chain = MagicMock()
        service.routing_chain.ainvoke = AsyncMock(return_value="brazil")
        
        # Test
        retriever = await service.decide_retriever({"question": "News about Rio?"})
        
        # Assert
        assert retriever == service.brazil_retriever

@pytest.mark.asyncio
async def test_decide_retriever_europe():
    with patch("app.services.rag_service.ChatGroq") as MockGroq, \
         patch("app.services.rag_service.get_retriever") as mock_get_retriever, \
         patch("app.services.rag_service.settings") as mock_settings:
        
        mock_settings.get_prompts.return_value = {
            "router_prompt_template": "router",
            "final_prompt_template": "final"
        }

        service = RAGService()
        service.routing_chain = MagicMock()
        service.routing_chain.ainvoke = AsyncMock(return_value="europe")
        
        retriever = await service.decide_retriever({"question": "News about Paris?"})
        
        assert retriever == service.europe_retriever

@pytest.mark.asyncio
async def test_decide_retriever_default():
    with patch("app.services.rag_service.ChatGroq") as MockGroq, \
         patch("app.services.rag_service.get_retriever") as mock_get_retriever, \
         patch("app.services.rag_service.settings") as mock_settings:
        
        mock_settings.get_prompts.return_value = {
            "router_prompt_template": "router",
            "final_prompt_template": "final"
        }

        service = RAGService()
        service.routing_chain = MagicMock()
        service.routing_chain.ainvoke = AsyncMock(return_value="unknown")
        
        # Should default to Brazil
        retriever = await service.decide_retriever({"question": "Random question"})
        
        assert retriever == service.brazil_retriever
