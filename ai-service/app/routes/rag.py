from fastapi import APIRouter, Depends

from app.schemas.rag import RagQueryRequest, RagQueryResponse
from app.services.rag_service import RagService, get_rag_service


router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/query", response_model=RagQueryResponse)
async def query_medical_records(
    request: RagQueryRequest,
    service: RagService = Depends(get_rag_service),
) -> RagQueryResponse:
    return await service.query(request)
