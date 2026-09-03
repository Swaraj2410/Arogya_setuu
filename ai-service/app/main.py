from fastapi import FastAPI

from app.routes.clinical_notes import router as clinical_notes_router
from app.routes.follow_up import router as follow_up_router
from app.routes.health import router as health_router
from app.routes.prescription_ocr import router as prescription_ocr_router
from app.routes.rag import router as rag_router
from app.routes.triage import router as triage_router
from app.routes.voice import router as voice_router


app = FastAPI(
    title="Arogya Rural AI Service",
    version="0.1.0",
    description="Gemini-backed triage, record Q&A, and clinical documentation drafting for Arogya Rural.",
)

app.include_router(health_router)
app.include_router(triage_router)
app.include_router(rag_router)
app.include_router(clinical_notes_router)
app.include_router(prescription_ocr_router)
app.include_router(voice_router)
app.include_router(follow_up_router)
