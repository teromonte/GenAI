from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
from app.services.rag_service import get_rag_service
from app.core.security import create_access_token
from app.db.models import User
from app.core.security import get_password_hash
from langchain_core.documents import Document

def test_chat_endpoint(client: TestClient, db_session):
    # 1. Create a user and get a token
    user = User(email="chat@example.com", hashed_password=get_password_hash("pass"))
    db_session.add(user)
    db_session.commit()
    token = create_access_token(data={"sub": "chat@example.com"})

    # 2. Mock the RAG Service
    mock_service = MagicMock()
    # Use AsyncMock for the async method
    mock_service.ask_question = AsyncMock(return_value={
        "answer": "This is a mocked answer.",
        "context": [
            Document(page_content="Source text 1", metadata={"source": "http://example.com/1"}),
            Document(page_content="Source text 2", metadata={"source": "http://example.com/2"})
        ]
    })

    # Override the dependency
    from app.main import app
    app.dependency_overrides[get_rag_service] = lambda: mock_service

    try:
        # 3. Call the endpoint
        response = client.post(
            "/api/chat",
            json={"question": "What is the news?"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # 4. Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "This is a mocked answer."
        assert len(data["source_documents"]) == 2
        assert data["source_documents"][0]["page_content"] == "Source text 1"

        # Verify RAG service was called
        mock_service.ask_question.assert_called_once_with("What is the news?")

    finally:
        app.dependency_overrides.clear()
