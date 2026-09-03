import json
import logging
from functools import lru_cache

from fastapi import HTTPException, status
from google import genai
from google.genai import errors
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.prompts.follow_up_prompt import FOLLOW_UP_SYSTEM_PROMPT
from app.schemas.follow_up import FOLLOW_UP_RESPONSE_SCHEMA, FollowUpAnalysisResponse, FollowUpAnalyzeRequest


logger = logging.getLogger(__name__)


class FollowUpService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: genai.Client | None = None

    async def analyze(self, request: FollowUpAnalyzeRequest) -> FollowUpAnalysisResponse:
        self.ensure_configured()

        try:
            interaction = await self.client.aio.interactions.create(
                model=self.settings.gemini_model,
                input=self._build_prompt(request.consultationNotes),
                system_instruction=FOLLOW_UP_SYSTEM_PROMPT,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": FOLLOW_UP_RESPONSE_SCHEMA,
                },
            )
            output_text = getattr(interaction, "output_text", None)
            if not output_text:
                raise ValueError("Gemini returned an empty follow-up analysis.")
            return FollowUpAnalysisResponse.model_validate_json(output_text)
        except (ValidationError, ValueError) as exception:
            logger.warning("Gemini follow-up returned invalid structured output: %s", exception)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI follow-up assistant returned an invalid analysis.",
            ) from exception
        except errors.APIError as exception:
            logger.exception("Gemini follow-up API error %s: %s", exception.code, exception.message)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gemini API error {exception.code}: {exception.message}",
            ) from exception
        except Exception as exception:
            logger.exception("Gemini follow-up analysis failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI follow-up assistant is temporarily unavailable.",
            ) from exception

    def ensure_configured(self) -> None:
        if not self.settings.gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured.",
            )

    @staticmethod
    def _build_prompt(consultation_notes: str) -> str:
        payload = {"consultationNotes": consultation_notes}
        return (
            "Extract only explicit follow-up instructions from these consultation notes. "
            "Return no follow-up if the instruction is not clearly present.\n\n"
            f"{json.dumps(payload, ensure_ascii=False)}"
        )

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client


@lru_cache
def _get_cached_follow_up_service() -> FollowUpService:
    return FollowUpService(get_settings())


def get_follow_up_service() -> FollowUpService:
    return _get_cached_follow_up_service()
