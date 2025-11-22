import sys
import os
from unittest.mock import MagicMock

# Add project root to python path
sys.path.append(os.getcwd())

try:
    from app.services.rss_fetcher import RSSFetcher
    from app.services.vector_service import VectorService
    from app.services.feed_service import FeedService
    from app.services.rag_service import RAGService
    
    print("Imports successful.")

    rss_fetcher = RSSFetcher()
    print("RSSFetcher instantiated.")

    # Mock VectorService
    mock_vector_service = MagicMock(spec=VectorService)
    
    class MockDB:
        pass
    
    # Pass mock_vector_service to avoid loading the model
    feed_service = FeedService(db=MockDB(), rss_fetcher=rss_fetcher, vector_service=mock_vector_service)
    print("FeedService instantiated.")

    rag_service = RAGService(vector_service=mock_vector_service)
    print("RAGService instantiated.")

    print("Verification successful.")

except Exception as e:
    print(f"Verification failed: {e}")
    import traceback
    traceback.print_exc()
