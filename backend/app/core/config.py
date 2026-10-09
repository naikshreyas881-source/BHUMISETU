from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BHUMISETU"
    TAGLINE: str = "Bridging Farms to a Better Future"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "bhumisetu-dev-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for local development ease
    
    # Database
    DATABASE_URL: str = "sqlite:///./bhumisetu.db"
    
    # AI & External Integrations
    GEMINI_API_KEY: Union[str, None] = None
    OPENWEATHERMAP_API_KEY: Union[str, None] = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
