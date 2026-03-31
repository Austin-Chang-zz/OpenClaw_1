import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "OpenClaw"
    app_version: str = "1.0.0"
    debug: bool = False

    database_url: str = os.environ.get("DATABASE_URL", "")
    redis_url: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    secret_key: str = os.environ.get("SECRET_KEY", "openclaw-dev-secret-key-change-in-production")
    access_token_expire_minutes: int = 60 * 24

    openai_api_key: Optional[str] = os.environ.get("OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = os.environ.get("ANTHROPIC_API_KEY")
    deepseek_api_key: Optional[str] = os.environ.get("DEEPSEEK_API_KEY")

    default_language: str = "zh-TW"
    allowed_origins: list = ["*"]

    class Config:
        env_file = ".env"


settings = Settings()
