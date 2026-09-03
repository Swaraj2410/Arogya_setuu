from pydantic import BaseModel, ConfigDict, Field, field_validator


class FollowUpAnalyzeRequest(BaseModel):
    consultationNotes: str = Field(min_length=3, max_length=4000)

    @field_validator("consultationNotes")
    @classmethod
    def clean_notes(cls, value: str) -> str:
        cleaned = "\n".join(line.strip() for line in value.splitlines())
        cleaned = "\n".join(line for line in cleaned.splitlines() if line)
        if len(cleaned) < 3:
            raise ValueError("consultationNotes must contain at least 3 characters")
        return cleaned


class FollowUpAnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    followUpRequired: bool
    afterDays: int | None = Field(default=None, ge=1, le=365)
    followUpDateText: str = Field(default="", max_length=120)
    reason: str = Field(default="", max_length=500)
    reminderMessage: str = Field(default="", max_length=500)
    requiresReview: bool = False
    reviewReason: str = Field(default="", max_length=300)

    @field_validator("followUpDateText", "reason", "reminderMessage", "reviewReason", mode="before")
    @classmethod
    def clean_text_field(cls, value: str | None) -> str:
        if value is None:
            return ""
        if not isinstance(value, str):
            raise ValueError("follow-up text fields must be strings")
        return " ".join(value.split())


FOLLOW_UP_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "followUpRequired": {"type": "boolean"},
        "afterDays": {"type": ["integer", "null"], "minimum": 1, "maximum": 365},
        "followUpDateText": {"type": "string", "maxLength": 120},
        "reason": {"type": "string", "maxLength": 500},
        "reminderMessage": {"type": "string", "maxLength": 500},
        "requiresReview": {"type": "boolean"},
        "reviewReason": {"type": "string", "maxLength": 300},
    },
    "required": [
        "followUpRequired",
        "afterDays",
        "followUpDateText",
        "reason",
        "reminderMessage",
        "requiresReview",
        "reviewReason",
    ],
}
