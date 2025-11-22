from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models import User
from app.api.schemas import FeedCreate, FeedOut, ArticleOut
from app.services.feed_service import FeedService

router = APIRouter()

def get_feed_service(db: Session = Depends(get_db)) -> FeedService:
    return FeedService(db)

@router.post("", response_model=FeedOut)
def create_feed(
    feed_in: FeedCreate,
    current_user: User = Depends(get_current_user),
    service: FeedService = Depends(get_feed_service)
):
    """
    Add a new RSS feed.
    """
    try:
        return service.create_feed(feed_in.name, feed_in.url, feed_in.category)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[FeedOut])
def get_feeds(
    current_user: User = Depends(get_current_user),
    service: FeedService = Depends(get_feed_service)
):
    """
    List all RSS feeds.
    """
    return service.get_feeds()

@router.delete("/{feed_id}", status_code=204)
def delete_feed(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    service: FeedService = Depends(get_feed_service)
):
    """
    Delete an RSS feed.
    """
    service.delete_feed(feed_id)
    return

@router.post("/{feed_id}/refresh")
def refresh_feed(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    service: FeedService = Depends(get_feed_service)
):
    """
    Manually trigger a refresh for a specific feed.
    """
    try:
        count = service.update_feed_articles(feed_id)
        return {"message": "Feed refreshed successfully", "new_articles": count}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
