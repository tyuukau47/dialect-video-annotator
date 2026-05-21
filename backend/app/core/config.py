from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Dialect Video Annotator API"
    api_v1_prefix: str = "/api"
    debug: bool = False
    database_url: str = "sqlite:///./dialect_video_annotator.db"
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    default_page_size: int = 25
    max_page_size: int = 100
    seed_on_startup: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="DVA_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
