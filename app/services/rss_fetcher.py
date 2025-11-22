import feedparser
import structlog
from typing import List, Dict, Any

logger = structlog.get_logger()

class RSSFetcher:
    def fetch(self, url: str) -> List[Dict[str, Any]]:
        """
        Fetches and parses an RSS feed using feedparser.
        """
        try:
            feed = feedparser.parse(url)
            if feed.bozo:
                logger.warning("feed_parse_warning", url=url, error=feed.bozo_exception)
            
            return feed.entries
        except Exception as e:
            logger.error("feed_fetch_error", url=url, error=str(e))
            return []
