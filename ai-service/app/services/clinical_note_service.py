import asyncio
import json
import logging
from functools import lru_cache

from google import genai
from google.genai import errors
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.prompts.clinical_note_prompt import CLINICAL_NOTE_SYSTEM_PROMPT
from app.schemas.clinical_notes import (
    CLINICAL_NOTE_RESPONSE_SCHEMA,
    ClinicalNoteDraftResponse,
    ClinicalNoteGenerateRequest,
)


logger = logging.getLogger(__name__)


class ClinicalNoteService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: genai.Client | None = None

    async def generate(self, request: ClinicalNoteGenerateRequest) -> ClinicalNoteDraftResponse:
        if not self.settings.gemini_api_key:
            logger.warning("Gemini API key is not configured; using conservative clinical note fallback")
            return self._fallback_draft(request.roughNotes)

        try:
            interaction = await asyncio.wait_for(
                self.client.aio.interactions.create(
                    model=self.settings.gemini_model,
                    input=self._build_prompt(request.roughNotes),
                    system_instruction=CLINICAL_NOTE_SYSTEM_PROMPT,
                    response_format={
                        "type": "text",
                        "mime_type": "application/json",
                        "schema": CLINICAL_NOTE_RESPONSE_SCHEMA,
                    },
                ),
                timeout=self.settings.gemini_timeout_seconds,
            )
            output_text = getattr(interaction, "output_text", None)
            if not output_text:
                raise ValueError("Gemini returned an empty clinical note draft.")
            return ClinicalNoteDraftResponse.model_validate_json(output_text)
        except (ValidationError, ValueError) as exception:
            logger.warning("Gemini clinical note returned invalid structured output: %s", exception)
            return self._fallback_draft(request.roughNotes)
        except asyncio.TimeoutError:
            logger.warning("Gemini clinical note timed out after %s seconds", self.settings.gemini_timeout_seconds)
            return self._fallback_draft(request.roughNotes)
        except errors.APIError as exception:
            logger.warning("Gemini clinical note API error %s: %s", exception.code, exception.message)
            return self._fallback_draft(request.roughNotes)
        except Exception as exception:
            logger.warning("Gemini clinical note request failed; using conservative fallback: %s", exception)
            return self._fallback_draft(request.roughNotes)

    def ensure_configured(self) -> None:
        if not self.settings.gemini_api_key:
            logger.warning("Gemini API key is not configured; clinical notes will use conservative fallback")

    @staticmethod
    def _build_prompt(rough_notes: str) -> str:
        payload = {"roughNotes": rough_notes}
        return (
            "Create a draft for the existing Complete Visit form from these rough notes. "
            "Use empty strings for any missing field and do not add facts that are not present.\n\n"
            f"{json.dumps(payload, ensure_ascii=False)}"
        )

    @staticmethod
    def _fallback_draft(rough_notes: str) -> ClinicalNoteDraftResponse:
        return ClinicalNoteDraftResponse(
            diagnosis="",
            treatment="",
            medicines="",
            dosageInstructions="",
            notes=rough_notes[:1200],
        )

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client


@lru_cache
def _get_cached_clinical_note_service() -> ClinicalNoteService:
    return ClinicalNoteService(get_settings())


def get_clinical_note_service() -> ClinicalNoteService:
    return _get_cached_clinical_note_service()
