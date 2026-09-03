from fastapi import APIRouter, Depends

from app.schemas.triage import TriageRequest, TriageResponse
from app.services.gemini_triage_service import GeminiTriageService, get_triage_service


router = APIRouter(tags=["triage"])


@router.post("/triage", response_model=TriageResponse)
async def triage(
    request: TriageRequest,
    service: GeminiTriageService = Depends(get_triage_service),
) -> TriageResponse:
    return await service.triage(request)
