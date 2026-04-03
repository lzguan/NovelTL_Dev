import uuid
from typing import Protocol

from arq import ArqRedis
from redis.exceptions import ConnectionError, ResponseError, TimeoutError

from .exceptions import TranslationEnqueueFailedException, TranslationQueueFullException


class TranslationDispatcher(Protocol):
    """
    Abstract dispatcher for enqueuing a novel translation job to some queue.
    """

    async def enqueue(
        self,
        job_id: str,
        translation_job_id: uuid.UUID,
    ) -> None:
        """
        Enqueue a novel translation request.

        Args:
            job_id: String id to queue job with (for ARQ deduplication).
            translation_job_id: UUID identifier for the NovelTranslationJob in the db.

        Raises:
            TranslationQueueFullException: Queue is full.
            TranslationEnqueueFailedException: Enqueue failed for some other reason.
        """
        ...


class ArqTranslationDispatcher:
    def __init__(self, redis_pool: ArqRedis) -> None:
        self.redis = redis_pool

    async def enqueue(
        self,
        job_id: str,
        translation_job_id: uuid.UUID,
    ) -> None:
        try:
            await self.redis.enqueue_job(
                "translate_novel",
                job_id,
                translation_job_id,
                _job_id=job_id,
            )
        except (ConnectionError, TimeoutError, OSError) as e:
            raise TranslationEnqueueFailedException(f"Redis connection failed: {str(e)}") from e
        except ResponseError as e:
            if "OOM" in str(e):
                raise TranslationQueueFullException("Redis memory is full") from e
            raise TranslationEnqueueFailedException(f"Redis protocol error: {str(e)}") from e
        except (TypeError, ValueError) as e:
            raise TranslationEnqueueFailedException(f"Failed to serialize job data: {str(e)}") from e
