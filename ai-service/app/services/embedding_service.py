import logging
import os
from functools import lru_cache

from app.core.config import Settings, get_settings


logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._model = None
        self._hashing_vectorizer = None
        self._use_hashing_fallback = False

    def embed(self, texts: list[str]):
        if not texts:
            raise ValueError("At least one text is required for embedding.")

        if self._use_hashing_fallback:
            return self._hash_embeddings(texts)

        try:
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        except Exception:
            logger.exception("Local embedding model failed; using hashing fallback")
            self._use_hashing_fallback = True
            return self._hash_embeddings(texts)

        return embeddings.astype("float32")

    @property
    def model(self):
        if self._model is None:
            try:
                os.environ.setdefault("HF_HUB_OFFLINE", "1")
                os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
                from sentence_transformers import SentenceTransformer
            except Exception:
                logger.exception("sentence-transformers is not installed or failed to import")
                raise

            self._model = SentenceTransformer(
                self.settings.rag_embedding_model,
                local_files_only=True,
            )
        return self._model

    def _hash_embeddings(self, texts: list[str]):
        if self._hashing_vectorizer is None:
            from sklearn.feature_extraction.text import HashingVectorizer

            self._hashing_vectorizer = HashingVectorizer(
                n_features=384,
                alternate_sign=False,
                norm="l2",
            )

        return self._hashing_vectorizer.transform(texts).toarray().astype("float32")


@lru_cache
def _get_cached_embedding_service() -> EmbeddingService:
    return EmbeddingService(get_settings())


def get_embedding_service() -> EmbeddingService:
    return _get_cached_embedding_service()
