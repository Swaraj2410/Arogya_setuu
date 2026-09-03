from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.schemas.voice import VoiceTranscriptionResponse
from app.services.voice_transcription_service import (
    VoiceTranscriptionService,
    get_voice_transcription_service,
)


router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_voice(
    file: UploadFile = File(...),
    language: str | None = Form(default=None),
    service: VoiceTranscriptionService = Depends(get_voice_transcription_service),
) -> VoiceTranscriptionResponse:
    return await service.transcribe(file, language)
