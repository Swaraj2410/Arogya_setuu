import asyncio
import json
import logging
from functools import lru_cache

from google import genai
from google.genai import errors
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.prompts.rag_prompt import RAG_SYSTEM_PROMPT
from app.schemas.rag import RAG_RESPONSE_SCHEMA, RagQueryResponse, RagSource


logger = logging.getLogger(__name__)
NOT_AVAILABLE = "This information is not available in the patient's medical records."


class GeminiRagService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: genai.Client | None = None

    async def answer(self, question: str, retrieved_context: list[dict]) -> RagQueryResponse:
        if not self.settings.gemini_api_key:
            logger.warning("Gemini API key is not configured; using medical-record excerpt fallback")
            return self._fallback_response(retrieved_context)

        try:
            interaction = await asyncio.wait_for(
                self.client.aio.interactions.create(
                    model=self.settings.gemini_model,
                    input=self._build_prompt(question, retrieved_context),
                    system_instruction=RAG_SYSTEM_PROMPT,
                    response_format={
                        "type": "text",
                        "mime_type": "application/json",
                        "schema": RAG_RESPONSE_SCHEMA,
                    },
                ),
                timeout=self.settings.gemini_timeout_seconds,
            )
            output_text = getattr(interaction, "output_text", None)
            if not output_text:
                raise ValueError("Gemini returned an empty RAG response.")
            return RagQueryResponse.model_validate_json(output_text)
        except (ValidationError, ValueError) as exception:
            logger.warning("Gemini RAG returned invalid structured output: %s", exception)
            return self._fallback_response(retrieved_context)
        except asyncio.TimeoutError:
            logger.warning("Gemini RAG timed out after %s seconds", self.settings.gemini_timeout_seconds)
            return self._fallback_response(retrieved_context)
        except errors.APIError as exception:
            logger.warning("Gemini RAG API error %s: %s", exception.code, exception.message)
            return self._fallback_response(retrieved_context)
        except Exception as exception:
            logger.warning("Gemini RAG request failed; using medical-record excerpt fallback: %s", exception)
            return self._fallback_response(retrieved_context)

    def ensure_configured(self) -> None:
        if not self.settings.gemini_api_key:
            logger.warning("Gemini API key is not configured; RAG will use excerpt fallback")

    @staticmethod
    def _build_prompt(question: str, retrieved_context: list[dict]) -> str:
        payload = {
            "question": question,
            "retrievedMedicalContext": retrieved_context,
        }
        return json.dumps(payload, ensure_ascii=False)

    @staticmethod
    def _fallback_response(retrieved_context: list[dict]) -> RagQueryResponse:
        if not retrieved_context:
            return RagQueryResponse(answer=NOT_AVAILABLE, sources=[], retrievedChunks=0)

        snippets = []
        sources: list[RagSource] = []
        seen_sources = set()
        for item in retrieved_context[:3]:
            source = item.get("source") or {}
            try:
                rag_source = RagSource.model_validate(source)
                source_key = (rag_source.recordType, rag_source.recordId)
                if source_key not in seen_sources:
                    sources.append(rag_source)
                    seen_sources.add(source_key)
            except Exception:
                pass

            text = " ".join(str(item.get("text") or "").split())
            if text:
                snippets.append(text[:450])

        if not snippets:
            return RagQueryResponse(answer=NOT_AVAILABLE, sources=[], retrievedChunks=len(retrieved_context))

        answer = "Relevant information from the patient's records: " + " ".join(snippets)
        return RagQueryResponse(answer=answer[:2000], sources=sources, retrievedChunks=len(retrieved_context))

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
