"""
ARQ worker entry point for translation tasks (lightweight — only OpenAI SDK).

Usage:
    arq src.translation_worker.WorkerSettings
"""

from typing import Any

from arq.connections import RedisSettings

from .autolabels.worker.config import REDIS_HOST, REDIS_PORT
from .glossaries.worker.inference import OpenAITranslationModel
from .glossaries.worker.tasks import glossary_translate, translation_model_cache
from .translations.worker.inference import OpenAIChapterTranslationModel
from .translations.worker.tasks import translate_novel
from .translations.worker.tasks import translation_model_cache as novel_translation_model_cache


async def startup(ctx: Any) -> None:
    translation_model_cache["openai"] = OpenAITranslationModel()
    novel_translation_model_cache["openai"] = OpenAIChapterTranslationModel()


class WorkerSettings:
    functions = [glossary_translate, translate_novel] # type: ignore
    redis_settings = RedisSettings(host=REDIS_HOST, port=REDIS_PORT)

    on_startup = startup

    max_jobs = 4
    job_timeout = 600
