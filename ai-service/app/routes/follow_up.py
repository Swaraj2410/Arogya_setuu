from fastapi import APIRouter, Depends

from app.schemas.follow_up import FollowUpAnalysisResponse, FollowUpAnalyzeRequest
from app.services.follow_up_service import FollowUpService, get_follow_up_service


router = APIRouter(prefix="/follow-up", tags=["follow-up"])


@router.post("/analyze", response_model=FollowUpAnalysisResponse)
async def analyze_follow_up(
    request: FollowUpAnalyzeRequest,
    service: FollowUpService = Depends(get_follow_up_service),
) -> FollowUpAnalysisResponse:
    return await service.analyze(request)
