from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


SupportedLanguage = Literal["en", "hi", "mr"]


class VoiceTranscriptionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1, max_length=4000)
    language: SupportedLanguage

    @field_validator("text")
    @classmethod
    def clean_text(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("transcription text is required")
        return cleaned
