from pydantic import BaseModel, ConfigDict, Field, field_validator


class ClinicalNoteGenerateRequest(BaseModel):
    roughNotes: str = Field(min_length=3, max_length=4000)

    @field_validator("roughNotes")
    @classmethod
    def clean_rough_notes(cls, value: str) -> str:
        cleaned = "\n".join(line.strip() for line in value.splitlines())
        cleaned = "\n".join(line for line in cleaned.splitlines() if line)
        if len(cleaned) < 3:
            raise ValueError("roughNotes must contain at least 3 characters")
        return cleaned


class ClinicalNoteDraftResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    diagnosis: str = Field(default="", max_length=500)
    treatment: str = Field(default="", max_length=800)
    medicines: str = Field(default="", max_length=800)
    dosageInstructions: str = Field(default="", max_length=800)
    notes: str = Field(default="", max_length=1200)

    @field_validator("diagnosis", "treatment", "medicines", "dosageInstructions", "notes", mode="before")
    @classmethod
    def clean_text_field(cls, value: str | None) -> str:
        if value is None:
            return ""
        if not isinstance(value, str):
            raise ValueError("clinical note draft fields must be strings")
        return " ".join(value.split())


CLINICAL_NOTE_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "diagnosis": {
            "type": "string",
            "maxLength": 500,
        },
        "treatment": {
            "type": "string",
            "maxLength": 800,
        },
        "medicines": {
            "type": "string",
            "maxLength": 800,
        },
        "dosageInstructions": {
            "type": "string",
            "maxLength": 800,
        },
        "notes": {
            "type": "string",
            "maxLength": 1200,
        },
    },
    "required": ["diagnosis", "treatment", "medicines", "dosageInstructions", "notes"],
}
