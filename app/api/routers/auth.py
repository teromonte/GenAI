from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import structlog

from app.db.session import get_db
from app.db.models import User
from app.api import schemas
from app.core import security, config

router = APIRouter()
logger = structlog.get_logger("auth")

@router.post("/signup", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    # 1. Check if email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash the password
    hashed_password = security.get_password_hash(user.password)
    
    # 3. Save to DB
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info("user_signed_up", user_id=new_user.id, email=new_user.email)
    return new_user

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # 1. Find user by email
    # OAuth2 spec says the field is 'username', but we use email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # 2. Verify User and Password
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        logger.warning("login_failed", email=form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create Token
    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    logger.info("login_success", user_id=user.id, email=user.email)
    return {"access_token": access_token, "token_type": "bearer"}