import json
import logging
from functools import lru_cache

from fastapi import HTTPException, status
from google import genai
from google.genai import errors
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.prompts.triage_prompt import TRIAGE_SYSTEM_PROMPT
from app.schemas.triage import TRIAGE_RESPONSE_SCHEMA, TriageRequest, TriageResponse, Urgency


logger = logging.getLogger(__name__)


class GeminiTriageService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: genai.Client | None = None

    async def triage(self, request: TriageRequest) -> TriageResponse:
        if not self.settings.gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured.",
            )

        try:
            response = await self._gemini_response(request)
        except (ValidationError, ValueError) as exception:
            logger.warning("Gemini triage returned invalid structured output: %s", exception)
            return self._safe_fallback(request.allowedSpecializations)
        except errors.APIError as exception:
            logger.exception("Gemini API error %s: %s", exception.code, exception.message)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gemini API error {exception.code}: {exception.message}",
            ) from exception
        except Exception as exception:
            logger.exception("Gemini triage request failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI triage is temporarily unavailable.",
            ) from exception

        return self._validated_or_fallback(response, request.allowedSpecializations)

    async def _gemini_response(self, request: TriageRequest) -> TriageResponse:
        interaction = await self.client.aio.interactions.create(
            model=self.settings.gemini_model,
            input=self._build_user_prompt(request),
            system_instruction=TRIAGE_SYSTEM_PROMPT,
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": TRIAGE_RESPONSE_SCHEMA,
            },
        )

        output_text = getattr(interaction, "output_text", None)
        if output_text:
            return TriageResponse.model_validate_json(output_text)
        raise ValueError("Gemini returned an empty triage response.")

    def _validated_or_fallback(
        self,
        response: TriageResponse,
        allowed_specializations: list[str],
    ) -> TriageResponse:
        allowed_by_key = {item.casefold(): item for item in allowed_specializations}
        recommended = allowed_by_key.get(response.recommendedSpecialization.casefold())
        if recommended:
            response.recommendedSpecialization = recommended
            return response

        return self._safe_fallback(allowed_specializations)

    def _safe_fallback(self, allowed_specializations: list[str]) -> TriageResponse:
        specialization = self._fallback_specialization(allowed_specializations)
        return TriageResponse(
            urgency=Urgency.MEDIUM,
            recommendedSpecialization=specialization,
            reason="The symptoms need a clinician review and could not be routed confidently.",
            recommendation=f"Book a consultation with {specialization} or seek urgent care if symptoms worsen.",
            warningSigns=[
                "Severe chest pain",
                "Difficulty breathing",
                "Loss of consciousness",
                "Heavy bleeding",
            ],
        )

    @staticmethod
    def _fallback_specialization(allowed_specializations: list[str]) -> str:
        for item in allowed_specializations:
            if item.casefold() == "general medicine":
                return item
        return allowed_specializations[0]

    @staticmethod
    def _build_user_prompt(request: TriageRequest) -> str:
        payload = {
            "symptoms": request.symptoms,
            "allowedSpecializations": request.allowedSpecializations,
            "responseLanguage": request.language,
        }
        return (
            "Classify the symptoms and choose exactly one allowed specialization. "
            "Use responseLanguage for human-facing text only. "
            "Return only the structured JSON object requested by the response schema.\n\n"
            f"{json.dumps(payload, ensure_ascii=False)}"
        )

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client


@lru_cache
def _get_cached_triage_service() -> GeminiTriageService:
    return GeminiTriageService(get_settings())


def get_triage_service() -> GeminiTriageService:
    return _get_cached_triage_service()
