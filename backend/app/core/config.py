import os
import sys
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "OpenClaw"
    app_version: str = "1.0.0"
    debug: bool = False

    database_url: str = os.environ.get("DATABASE_URL", "")
    redis_url: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    secret_key: str = os.environ.get("SECRET_KEY", "openclaw-dev-secret-change-in-production")
    access_token_expire_minutes: int = 60 * 24

    openai_api_key: Optional[str] = os.environ.get("OPENAI_API_KEY") or None
    anthropic_api_key: Optional[str] = os.environ.get("ANTHROPIC_API_KEY") or None
    deepseek_api_key: Optional[str] = os.environ.get("DEEPSEEK_API_KEY") or None
    minimax_api_key: Optional[str] = os.environ.get("MINIMAX_API_KEY") or None

    default_language: str = "zh-TW"
    allowed_origins: list = ["*"]

    class Config:
        env_file = ".env"


def _validate_required_settings(s: Settings) -> None:
    errors = []
    if not s.database_url:
        errors.append("DATABASE_URL is not set")
    if s.secret_key == "openclaw-dev-secret-change-in-production":
        import logging
        logging.warning(
            "SECRET_KEY is using the default development value. "
            "Set a strong SECRET_KEY in production."
        )
    if errors:
        for msg in errors:
            print(f"[OpenClaw] STARTUP ERROR: {msg}", file=sys.stderr)
        sys.exit(1)


settings = Settings()
_validate_required_settings(settings)
