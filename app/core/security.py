from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import jwt
from app.core.config import settings

# 1. Password Hashing Setup
# We use bcrypt, the industry standard for password storage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Checks if a raw password matches the hash in the DB."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Converts a raw password into a secure hash."""
    return pwd_context.hash(password)

# 2. JWT Token Creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Generates a JWT token signed with our SECRET_KEY."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    
    # Create the encoded JWT string
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt