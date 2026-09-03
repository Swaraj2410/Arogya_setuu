import json
import logging
from functools import lru_cache

from fastapi import HTTPException, status
from google import genai
from google.genai import errors
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.prompts.rag_prompt import RAG_SYSTEM_PROMPT
from app.schemas.rag import RAG_RESPONSE_SCHEMA, RagQueryResponse


logger = logging.getLogger(__name__)
NOT_AVAILABLE = "This information is not available in the patient's medical records."


class GeminiRagService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: genai.Client | None = None

    async def answer(self, question: str, retrieved_context: list[dict]) -> RagQueryResponse:
        self.ensure_configured()

        try:
            interaction = await self.client.aio.interactions.create(
                model=self.settings.gemini_model,
                input=self._build_prompt(question, retrieved_context),
                system_instruction=RAG_SYSTEM_PROMPT,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": RAG_RESPONSE_SCHEMA,
                },
            )
            output_text = getattr(interaction, "output_text", None)
            if not output_text:
                raise ValueError("Gemini returned an empty RAG response.")
            return RagQueryResponse.model_validate_json(output_text)
        except (ValidationError, ValueError) as exception:
            logger.warning("Gemini RAG returned invalid structured output: %s", exception)
            return RagQueryResponse(answer=NOT_AVAILABLE, sources=[], retrievedChunks=len(retrieved_context))
        except errors.APIError as exception:
            logger.exception("Gemini RAG API error %s: %s", exception.code, exception.message)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gemini API error {exception.code}: {exception.message}",
            ) from exception
        except Exception as exception:
            logger.exception("Gemini RAG request failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Medical record AI assistant is temporarily unavailable.",
            ) from exception

    def ensure_configured(self) -> None:
        if not self.settings.gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured.",
            )

    @staticmethod
    def _build_prompt(question: str, retrieved_context: list[dict]) -> str:
        payload = {
            "question": question,
            "retrievedMedicalContext": retrieved_context,
        }
        return json.dumps(payload, ensure_ascii=False)

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client


@lru_cache
def _get_cached_gemini_rag_service() -> GeminiRagService:
    return GeminiRagService(get_settings())


def get_gemini_rag_service() -> GeminiRagService:
    return _get_cached_gemini_rag_service()
