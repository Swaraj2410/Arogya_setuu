from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Urgency(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"


class TriageRequest(BaseModel):
    symptoms: str = Field(min_length=5, max_length=2000)
    allowedSpecializations: list[str] = Field(min_length=1, max_length=100)
    language: Literal["en", "hi", "mr"] = "en"

    @field_validator("symptoms")
    @classmethod
    def clean_symptoms(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 5:
            raise ValueError("symptoms must contain at least 5 characters")
        return cleaned

    @field_validator("allowedSpecializations")
    @classmethod
    def clean_specializations(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for value in values:
            name = " ".join(str(value).split())
            if not name:
                continue
            key = name.casefold()
            if key not in seen:
                cleaned.append(name)
                seen.add(key)

        if not cleaned:
            raise ValueError("at least one allowed specialization is required")
        return cleaned


class TriageResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    urgency: Urgency
    recommendedSpecialization: str = Field(min_length=1, max_length=120)
    reason: str = Field(min_length=1, max_length=300)
    recommendation: str = Field(min_length=1, max_length=300)
    warningSigns: list[str] = Field(max_length=8)


TRIAGE_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "urgency": {
            "type": "string",
            "enum": ["LOW", "MEDIUM", "HIGH", "EMERGENCY"],
        },
        "recommendedSpecialization": {
            "type": "string",
            "minLength": 1,
            "maxLength": 120,
        },
        "reason": {
            "type": "string",
            "minLength": 1,
            "maxLength": 300,
        },
        "recommendation": {
            "type": "string",
            "minLength": 1,
            "maxLength": 300,
        },
        "warningSigns": {
            "type": "array",
            "items": {"type": "string"},
            "maxItems": 8,
        },
    },
    "required": [
        "urgency",
        "recommendedSpecialization",
        "reason",
        "recommendation",
        "warningSigns",
    ],
}
