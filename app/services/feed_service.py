import feedparser
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import structlog
from typing import List

from app.db.models import Feed, Article
from app.db.vector_store import get_retriever, get_embedding_function
# We might need a way to ADD documents to the vector store. 
# The current vector_store.py only returns a retriever.
# We'll need to instantiate Chroma directly or add a helper to add documents.
from langchain_chroma import Chroma
from langchain_core.documents import Document
from app.core.config import settings

logger = structlog.get_logger()

class FeedService:
    def __init__(self, db: Session):
        self.db = db
        self.embedding_function = get_embedding_function()
        # Initialize Chroma for writing
        self.vector_db = Chroma(
            collection_name="articles", # Dynamic collection for all articles
            persist_directory=settings.CHROMA_PATH,
            embedding_function=self.embedding_function,
        )

    def fetch_and_parse_feed(self, feed_url: str) -> List[dict]:
        """
        Fetches and parses an RSS feed using feedparser.
        """
        try:
            feed = feedparser.parse(feed_url)
            if feed.bozo:
                logger.warning("feed_parse_warning", url=feed_url, error=feed.bozo_exception)
            
            return feed.entries
        except Exception as e:
            logger.error("feed_fetch_error", url=feed_url, error=str(e))
            return []

    def update_feed_articles(self, feed_id: int) -> int:
        """
        Fetches the feed, saves new articles to DB, and embeds them.
        Returns the number of new articles added.
        """
        feed = self.db.query(Feed).filter(Feed.id == feed_id).first()
        if not feed:
            raise ValueError(f"Feed with id {feed_id} not found")

        entries = self.fetch_and_parse_feed(feed.url)
        new_articles_count = 0
        documents_to_embed = []

        for entry in entries:
            # Check if article already exists
            existing = self.db.query(Article).filter(Article.url == entry.link).first()
            if existing:
                continue

            # Create new article
            published = None
            if hasattr(entry, "published_parsed"):
                published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            
            article = Article(
                title=entry.title,
                content=entry.get("summary", "") or entry.get("description", ""),
                url=entry.link,
                published_date=published,
                feed_id=feed.id
            )
            self.db.add(article)
            self.db.flush() # Get ID
            
            new_articles_count += 1
            
            # Prepare for vector store
            # We store metadata to help with filtering/retrieval later
            doc = Document(
                page_content=f"{article.title}\n\n{article.content}",
                metadata={
                    "source": feed.name,
                    "url": article.url,
                    "category": feed.category,
                    "published_date": str(article.published_date),
                    "feed_id": feed.id,
                    "article_id": article.id
                }
            )
            documents_to_embed.append(doc)

        if documents_to_embed:
            self.vector_db.add_documents(documents_to_embed)
            logger.info("articles_embedded", count=len(documents_to_embed), feed=feed.name)

        feed.last_fetched = datetime.now(timezone.utc)
        self.db.commit()
        
        return new_articles_count

    def create_feed(self, name: str, url: str, category: str) -> Feed:
        feed = Feed(name=name, url=url, category=category)
        self.db.add(feed)
        self.db.commit()
        self.db.refresh(feed)
        return feed

    def get_feeds(self) -> List[Feed]:
        return self.db.query(Feed).all()

    def delete_feed(self, feed_id: int):
        feed = self.db.query(Feed).filter(Feed.id == feed_id).first()
        if feed:
            self.db.delete(feed)
            self.db.commit()
