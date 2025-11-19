from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# 1. Create the Database Engine
# This establishes the connection pool to Postgres
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

# 2. Create the SessionLocal class
# We will instantiate this class to create a database session for each request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Dependency for FastAPI
# This function will be used in our API routers (Dependency Injection!)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()