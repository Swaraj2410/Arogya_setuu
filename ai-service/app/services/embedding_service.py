import logging
from functools import lru_cache

from app.core.config import Settings, get_settings


logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._model = None

    def embed(self, texts: list[str]):
        if not texts:
            raise ValueError("At least one text is required for embedding.")

        try:
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        except Exception:
            logger.exception("Local embedding model failed")
            raise

        return embeddings.astype("float32")

    @property
    def model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
            except Exception:
                logger.exception("sentence-transformers is not installed or failed to import")
                raise

            self._model = SentenceTransformer(self.settings.rag_embedding_model)
        return self._model


@lru_cache
def _get_cached_embedding_service() -> EmbeddingService:
    return EmbeddingService(get_settings())


def get_embedding_service() -> EmbeddingService:
    return _get_cached_embedding_service()
