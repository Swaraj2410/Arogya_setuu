import logging
from dataclasses import dataclass
from functools import lru_cache

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas.rag import RagDocument, RagQueryRequest, RagQueryResponse, RagSource
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.services.gemini_rag_service import NOT_AVAILABLE, GeminiRagService, get_gemini_rag_service


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RagChunk:
    text: str
    source: RagSource
    metadata: dict


class RagService:
    def __init__(self, embedding_service: EmbeddingService, gemini_service: GeminiRagService):
        self.embedding_service = embedding_service
        self.gemini_service = gemini_service
        self.settings = get_settings()

    async def query(self, request: RagQueryRequest) -> RagQueryResponse:
        chunks = self._build_chunks(request.documents)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No medical record documents were provided.",
            )

        try:
            retrieved_chunks = self._retrieve(request.question, chunks)
        except Exception as exception:
            logger.exception("RAG retrieval failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Medical record search is temporarily unavailable.",
            ) from exception

        if not retrieved_chunks:
            return RagQueryResponse(answer=NOT_AVAILABLE, sources=[], retrievedChunks=0)

        context = [self._context_payload(chunk) for chunk in retrieved_chunks]
        response = await self.gemini_service.answer(request.question, context)
        return self._normalize_response(response, retrieved_chunks)

    def _retrieve(self, question: str, chunks: list[RagChunk]) -> list[RagChunk]:
        import faiss

        chunk_embeddings = self.embedding_service.embed([chunk.text for chunk in chunks])
        question_embedding = self.embedding_service.embed([question])
        index = faiss.IndexFlatIP(chunk_embeddings.shape[1])
        index.add(chunk_embeddings)

        top_k = min(self.settings.rag_top_k, len(chunks))
        _, indices = index.search(question_embedding, top_k)
        return [chunks[index] for index in indices[0] if index >= 0]

    def _build_chunks(self, documents: list[RagDocument]) -> list[RagChunk]:
        chunks: list[RagChunk] = []
        for document in documents:
            source = self._source_from_document(document)
            if source:
                chunks.append(RagChunk(text=document.text, source=source, metadata=document.metadata))
        return chunks

    @staticmethod
    def _source_from_document(document: RagDocument) -> RagSource | None:
        metadata = document.metadata or {}
        if document.type == "PRESCRIPTION":
            record_id = metadata.get("prescriptionId")
        else:
            record_id = metadata.get("medicalRecordId")

        try:
            parsed_id = int(record_id)
        except (TypeError, ValueError):
            return None

        visit_date = metadata.get("visitDate")
        return RagSource(recordType=document.type, recordId=parsed_id, date=str(visit_date) if visit_date else None)

    @staticmethod
    def _context_payload(chunk: RagChunk) -> dict:
        return {
            "source": chunk.source.model_dump(exclude_none=True),
            "metadata": chunk.metadata,
            "text": chunk.text,
        }

    @staticmethod
    def _normalize_response(response: RagQueryResponse, retrieved_chunks: list[RagChunk]) -> RagQueryResponse:
        valid_sources = {(chunk.source.recordType, chunk.source.recordId): chunk.source for chunk in retrieved_chunks}
        filtered_sources = []
        seen = set()
        for source in response.sources:
            key = (source.recordType, source.recordId)
            if key in valid_sources and key not in seen:
                filtered_sources.append(valid_sources[key])
                seen.add(key)

        if response.answer.strip() == NOT_AVAILABLE:
            filtered_sources = []
        elif not filtered_sources:
            filtered_sources = list(valid_sources.values())

        response.sources = filtered_sources
        response.retrievedChunks = len(retrieved_chunks)
        return response


@lru_cache
def _get_cached_rag_service() -> RagService:
    return RagService(get_embedding_service(), get_gemini_rag_service())


def get_rag_service() -> RagService:
    return _get_cached_rag_service()
