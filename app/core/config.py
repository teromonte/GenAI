from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    # --- Project Settings ---
    CHROMA_PATH: str
    EMBEDDING_MODEL_NAME: str
    
    # --- Groq LLM API Key ---
    GROQ_API_KEY: str
    GROQ_MODEL_NAME: str = "llama-3.1-8b-instant" # Default if not in .env

    # --- Database Settings ---
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    # --- Project Settings ---
    CHROMA_PATH: str
    EMBEDDING_MODEL_NAME: str
    
    # --- Groq LLM API Key ---
    GROQ_API_KEY: str
    GROQ_MODEL_NAME: str = "llama-3.1-8b-instant" # Default if not in .env

    # --- Database Settings ---
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: str
    POSTGRES_DB: str

    # --- Auth Settings ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # This constructs the connection string:
        # postgresql://user:password@server:port/db_name
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    def get_prompts(self) -> dict:
        import yaml
        import os
        
        prompts_path = os.path.join(os.path.dirname(__file__), "prompts.yaml")
        with open(prompts_path, "r") as f:
            return yaml.safe_load(f)

    def get_feeds(self) -> list:
        import yaml
        import os
        
        feeds_path = os.path.join(os.path.dirname(__file__), "feeds.yaml")
        with open(feeds_path, "r") as f:
            data = yaml.safe_load(f)
            return data.get("feeds", [])

settings = Settings()