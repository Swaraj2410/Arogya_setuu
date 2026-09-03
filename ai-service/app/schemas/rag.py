from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


RecordType = Literal["MEDICAL_RECORD", "PRESCRIPTION"]


class RagDocument(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    type: RecordType
    text: str = Field(min_length=1, max_length=6000)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("text")
    @classmethod
    def clean_text(cls, value: str) -> str:
        cleaned = "\n".join(line.strip() for line in value.splitlines())
        cleaned = "\n".join(line for line in cleaned.splitlines() if line)
        if not cleaned:
            raise ValueError("document text is required")
        return cleaned


class RagQueryRequest(BaseModel):
    patientId: int = Field(gt=0)
    question: str = Field(min_length=3, max_length=1000)
    documents: list[RagDocument] = Field(min_length=1, max_length=200)

    @field_validator("question")
    @classmethod
    def clean_question(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 3:
            raise ValueError("question must contain at least 3 characters")
        return cleaned


class RagSource(BaseModel):
    recordType: RecordType
    recordId: int
    date: str | None = None


class RagQueryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer: str = Field(min_length=1, max_length=2000)
    sources: list[RagSource] = Field(default_factory=list, max_length=12)
    retrievedChunks: int = Field(ge=0)


RAG_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "answer": {
            "type": "string",
            "minLength": 1,
            "maxLength": 2000,
        },
        "sources": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "recordType": {
                        "type": "string",
                        "enum": ["MEDICAL_RECORD", "PRESCRIPTION"],
                    },
                    "recordId": {
                        "type": "integer",
                    },
                    "date": {
                        "type": "string",
                    },
                },
                "required": ["recordType", "recordId"],
            },
            "maxItems": 12,
        },
        "retrievedChunks": {
            "type": "integer",
        },
    },
    "required": ["answer", "sources", "retrievedChunks"],
}
