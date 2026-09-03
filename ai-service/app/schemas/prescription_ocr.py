from pydantic import BaseModel, ConfigDict, Field, field_validator


class PrescriptionOcrMedicine(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(default="", max_length=200)
    dosage: str = Field(default="", max_length=120)
    frequency: str = Field(default="", max_length=160)
    duration: str = Field(default="", max_length=160)
    instructions: str = Field(default="", max_length=300)

    @field_validator("name", "dosage", "frequency", "duration", "instructions", mode="before")
    @classmethod
    def clean_field(cls, value: str | None) -> str:
        if value is None:
            return ""
        if not isinstance(value, str):
            raise ValueError("medicine fields must be strings")
        return " ".join(value.split())


class PrescriptionOcrExtraction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    medicines: list[PrescriptionOcrMedicine] = Field(default_factory=list, max_length=20)
    additionalInstructions: str = Field(default="", max_length=800)
    verificationRequired: bool = True
    qualityWarning: str = Field(default="", max_length=500)

    @field_validator("additionalInstructions", "qualityWarning", mode="before")
    @classmethod
    def clean_text_field(cls, value: str | None) -> str:
        if value is None:
            return ""
        if not isinstance(value, str):
            raise ValueError("prescription extraction fields must be strings")
        return " ".join(value.split())


class PrescriptionOcrResponse(PrescriptionOcrExtraction):
    rawText: str = Field(min_length=1, max_length=12000)


PRESCRIPTION_OCR_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "medicines": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "maxLength": 200},
                    "dosage": {"type": "string", "maxLength": 120},
                    "frequency": {"type": "string", "maxLength": 160},
                    "duration": {"type": "string", "maxLength": 160},
                    "instructions": {"type": "string", "maxLength": 300},
                },
                "required": ["name", "dosage", "frequency", "duration", "instructions"],
            },
            "maxItems": 20,
        },
        "additionalInstructions": {"type": "string", "maxLength": 800},
        "verificationRequired": {"type": "boolean"},
        "qualityWarning": {"type": "string", "maxLength": 500},
    },
    "required": ["medicines", "additionalInstructions", "verificationRequired", "qualityWarning"],
}
