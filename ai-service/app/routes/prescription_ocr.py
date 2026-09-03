from fastapi import APIRouter, Depends, File, UploadFile

from app.schemas.prescription_ocr import PrescriptionOcrResponse
from app.services.ocr_service import OcrService
from app.services.prescription_extraction_service import (
    PrescriptionExtractionService,
    get_prescription_extraction_service,
)


router = APIRouter(prefix="/prescription-ocr", tags=["prescription-ocr"])


def get_ocr_service() -> OcrService:
    return OcrService()


@router.post("/extract", response_model=PrescriptionOcrResponse)
async def extract_prescription(
    file: UploadFile = File(...),
    ocr_service: OcrService = Depends(get_ocr_service),
    extraction_service: PrescriptionExtractionService = Depends(get_prescription_extraction_service),
) -> PrescriptionOcrResponse:
    raw_text = await ocr_service.extract_text(file)
    extraction = await extraction_service.extract(raw_text)
    return PrescriptionOcrResponse(rawText=raw_text, **extraction.model_dump())
