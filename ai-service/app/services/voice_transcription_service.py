import logging
import os
import tempfile
from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.voice import VoiceTranscriptionResponse


logger = logging.getLogger(__name__)

MAX_AUDIO_BYTES = 15 * 1024 * 1024
SUPPORTED_LANGUAGES = {"en", "hi", "mr"}
SUPPORTED_AUDIO_TYPES = {
    "audio/webm",
    "video/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
}


class VoiceTranscriptionService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._model = None

    async def transcribe(self, file: UploadFile, language: str | None = None) -> VoiceTranscriptionResponse:
        normalized_language = self._normalize_language(language)
        content_type = (file.content_type or "").split(";")[0].strip().lower()
        if content_type not in SUPPORTED_AUDIO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported audio type. Upload WEBM, WAV, MP3, M4A, or OGG audio.",
            )

        content = await file.read()
        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audio file is empty.")
        if len(content) > MAX_AUDIO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Audio file must be 15 MB or smaller.",
            )

        temp_path = self._write_temp_audio(file.filename, content)
        try:
            segments, info = self.model.transcribe(
                temp_path,
                language=normalized_language,
                beam_size=1,
                vad_filter=True,
            )
            text = " ".join(segment.text.strip() for segment in segments if segment.text.strip())
        except RuntimeError as exception:
            logger.exception("Voice transcription model failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Voice transcription failed. Please try again with a clearer recording.",
            ) from exception
        except Exception as exception:
            logger.exception("Voice transcription failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Voice transcription is temporarily unavailable.",
            ) from exception
        finally:
            try:
                os.unlink(temp_path)
            except OSError:
                logger.debug("Could not remove temporary audio file: %s", temp_path)

        cleaned_text = " ".join(text.split())
        if not cleaned_text:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No speech was detected.")

        detected_language = normalized_language or getattr(info, "language", None) or "en"
        if detected_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unsupported spoken language. Use English, Hindi, or Marathi.",
            )

        return VoiceTranscriptionResponse(text=cleaned_text, language=detected_language)

    @property
    def model(self):
        if self._model is None:
            try:
                from faster_whisper import WhisperModel
            except Exception as exception:
                logger.exception("faster-whisper is not installed or failed to import")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Local speech-to-text model is not available. Install faster-whisper.",
                ) from exception

            self._model = WhisperModel(
                self.settings.voice_model,
                device=self.settings.voice_device,
                compute_type=self.settings.voice_compute_type,
            )
        return self._model

    @staticmethod
    def _normalize_language(language: str | None) -> str | None:
        if language is None or not language.strip():
            return None
        normalized = language.strip().lower()
        if normalized not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported language. Choose en, hi, or mr.",
            )
        return normalized

    @staticmethod
    def _write_temp_audio(filename: str | None, content: bytes) -> str:
        suffix = Path(filename or "").suffix
        if suffix.lower() not in {".webm", ".wav", ".mp3", ".m4a", ".ogg"}:
            suffix = ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            return temp_file.name


@lru_cache
def _get_cached_voice_transcription_service() -> VoiceTranscriptionService:
    return VoiceTranscriptionService(get_settings())


def get_voice_transcription_service() -> VoiceTranscriptionService:
    return _get_cached_voice_transcription_service()
