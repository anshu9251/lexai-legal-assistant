from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    GROQ_API_KEY: Optional[str] = None
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "legal_contracts"
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_ORIGINS: str = "*"

    # Load from .env file if it exists, otherwise fall back to environment variables
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
