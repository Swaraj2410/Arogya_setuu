from fastapi import APIRouter, Depends

from app.schemas.clinical_notes import ClinicalNoteDraftResponse, ClinicalNoteGenerateRequest
from app.services.clinical_note_service import ClinicalNoteService, get_clinical_note_service


router = APIRouter(prefix="/clinical-notes", tags=["clinical-notes"])


@router.post("/generate", response_model=ClinicalNoteDraftResponse)
async def generate_clinical_note(
    request: ClinicalNoteGenerateRequest,
    service: ClinicalNoteService = Depends(get_clinical_note_service),
) -> ClinicalNoteDraftResponse:
    return await service.generate(request)
