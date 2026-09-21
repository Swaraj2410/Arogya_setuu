import asyncio
import json
import logging
from functools import lru_cache

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
            logger.warning("Gemini API key is not configured; using safe triage fallback")
            return self._safe_fallback(request.allowedSpecializations, request.language)

        try:
            response = await asyncio.wait_for(
                self._gemini_response(request),
                timeout=self.settings.gemini_timeout_seconds,
            )
        except (ValidationError, ValueError) as exception:
            logger.warning("Gemini triage returned invalid structured output: %s", exception)
            return self._safe_fallback(request.allowedSpecializations, request.language)
        except asyncio.TimeoutError:
            logger.warning("Gemini triage timed out after %s seconds", self.settings.gemini_timeout_seconds)
            return self._safe_fallback(request.allowedSpecializations, request.language)
        except errors.APIError as exception:
            logger.warning("Gemini triage API error %s: %s", exception.code, exception.message)
            return self._safe_fallback(request.allowedSpecializations, request.language)
        except Exception as exception:
            logger.warning("Gemini triage request failed; using safe fallback: %s", exception)
            return self._safe_fallback(request.allowedSpecializations, request.language)

        return self._validated_or_fallback(response, request.allowedSpecializations, request.language)

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
        language: str,
    ) -> TriageResponse:
        allowed_by_key = {item.casefold(): item for item in allowed_specializations}
        recommended = allowed_by_key.get(response.recommendedSpecialization.casefold())
        if recommended:
            response.recommendedSpecialization = recommended
            return response

        return self._safe_fallback(allowed_specializations, language)

    def _safe_fallback(self, allowed_specializations: list[str], language: str) -> TriageResponse:
        specialization = self._fallback_specialization(allowed_specializations)
        return TriageResponse(
            urgency=Urgency.MEDIUM,
            recommendedSpecialization=specialization,
            reason=self._fallback_reason(language),
            recommendation=self._fallback_recommendation(specialization, language),
            warningSigns=self._fallback_warning_signs(language),
        )

    @staticmethod
    def _fallback_specialization(allowed_specializations: list[str]) -> str:
        for item in allowed_specializations:
            if item.casefold() == "general medicine":
                return item
        return allowed_specializations[0]

    @staticmethod
    def _fallback_reason(language: str) -> str:
        return {
            "hi": "इन लक्षणों की किसी योग्य डॉक्टर से जांच होनी चाहिए।",
            "mr": "या लक्षणांची पात्र डॉक्टरांकडून तपासणी होणे आवश्यक आहे.",
        }.get(language, "The symptoms should be reviewed by a qualified clinician.")

    @staticmethod
    def _fallback_recommendation(specialization: str, language: str) -> str:
        return {
            "hi": f"{specialization} के डॉक्टर से परामर्श बुक करें या लक्षण बिगड़ने पर तुरंत देखभाल लें।",
            "mr": f"{specialization} डॉक्टरांचा सल्ला घ्या किंवा लक्षणे वाढल्यास तातडीची मदत घ्या.",
        }.get(language, f"Book a consultation with {specialization} or seek urgent care if symptoms worsen.")

    @staticmethod
    def _fallback_warning_signs(language: str) -> list[str]:
        if language == "hi":
            return ["सीने में तेज दर्द", "सांस लेने में कठिनाई", "बेहोशी", "भारी रक्तस्राव"]
        if language == "mr":
            return ["छातीत तीव्र वेदना", "श्वास घेण्यास त्रास", "बेशुद्ध होणे", "जास्त रक्तस्राव"]
        return ["Severe chest pain", "Difficulty breathing", "Loss of consciousness", "Heavy bleeding"]

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
