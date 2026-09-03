import json
import logging
from functools import lru_cache

from fastapi import HTTPException, status
from google import genai
from google.genai import errors
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.prompts.prescription_ocr_prompt import PRESCRIPTION_OCR_SYSTEM_PROMPT
from app.schemas.prescription_ocr import PRESCRIPTION_OCR_RESPONSE_SCHEMA, PrescriptionOcrExtraction


logger = logging.getLogger(__name__)


class PrescriptionExtractionService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: genai.Client | None = None

    async def extract(self, raw_text: str) -> PrescriptionOcrExtraction:
        self.ensure_configured()

        try:
            interaction = await self.client.aio.interactions.create(
                model=self.settings.gemini_model,
                input=self._build_prompt(raw_text),
                system_instruction=PRESCRIPTION_OCR_SYSTEM_PROMPT,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": PRESCRIPTION_OCR_RESPONSE_SCHEMA,
                },
            )
            output_text = getattr(interaction, "output_text", None)
            if not output_text:
                raise ValueError("Gemini returned an empty prescription extraction.")
            return PrescriptionOcrExtraction.model_validate_json(output_text)
        except (ValidationError, ValueError) as exception:
            logger.warning("Gemini prescription OCR returned invalid structured output: %s", exception)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI prescription extractor returned an invalid draft.",
            ) from exception
        except errors.APIError as exception:
            logger.exception("Gemini prescription OCR API error %s: %s", exception.code, exception.message)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gemini API error {exception.code}: {exception.message}",
            ) from exception
        except Exception as exception:
            logger.exception("Gemini prescription extraction failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI prescription extractor is temporarily unavailable.",
            ) from exception

    def ensure_configured(self) -> None:
        if not self.settings.gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured.",
            )

    @staticmethod
    def _build_prompt(raw_text: str) -> str:
        payload = {"ocrText": raw_text}
        return (
            "Create a structured prescription draft from this OCR text. "
            "Use empty strings for missing or unclear fields.\n\n"
            f"{json.dumps(payload, ensure_ascii=False)}"
        )

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client


@lru_cache
def _get_cached_prescription_extraction_service() -> PrescriptionExtractionService:
    return PrescriptionExtractionService(get_settings())


def get_prescription_extraction_service() -> PrescriptionExtractionService:
    return _get_cached_prescription_extraction_service()
