from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional
import structlog

from app.core.config import settings
from app.db.session import get_db
from app.db.models import User

logger = structlog.get_logger("auth")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # --- FIX: Handle the type safety here ---
        # .get() returns Any or None. We explicitly type hint it as Optional[str]
        email: Optional[str] = payload.get("sub")
        
        if email is None:
            logger.warning("auth_token_missing_sub")
            raise credentials_exception
            
    except JWTError as exc:
        logger.warning("auth_token_invalid", error=str(exc))
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        logger.warning("auth_user_not_found", email=email)
        raise credentials_exception
    
    logger.debug("auth_user_verified", user_id=user.id)
    return user