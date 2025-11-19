from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # To load from a .env file
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    # --- Project Settings ---
    CHROMA_PATH: str
    EMBEDDING_MODEL_NAME: str
    
    # --- Groq LLM API Key ---
    GROQ_API_KEY: str

# Create a single, reusable instance of the settings
settings = Settings()