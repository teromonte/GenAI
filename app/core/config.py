from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # This part remains the same
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    # --- Project Settings ---
    CHROMA_PATH: str
    EMBEDDING_MODEL_NAME: str
    
    # --- Groq LLM API Key ---
    GROQ_API_KEY: str
    GROQ_MODEL_NAME: str # Add this line

# Create a single, reusable instance of the settings
settings = Settings()