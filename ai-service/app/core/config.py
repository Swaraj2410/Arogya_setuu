from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.7-flash", alias="GEMINI_MODEL")
    rag_embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        alias="RAG_EMBEDDING_MODEL",
    )
    rag_top_k: int = Field(default=4, alias="RAG_TOP_K", ge=1, le=12)
    voice_model: str = Field(default="base", alias="VOICE_MODEL")
    voice_device: str = Field(default="cpu", alias="VOICE_DEVICE")
    voice_compute_type: str = Field(default="int8", alias="VOICE_COMPUTE_TYPE")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
