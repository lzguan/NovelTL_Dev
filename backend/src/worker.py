"""
ARQ worker entry point for NER/autolabel tasks (heavy — loads transformers).

Usage:
    arq src.worker.WorkerSettings
"""

from typing import Any

from arq.connections import RedisSettings

from .autolabels.worker.config import REDIS_HOST, REDIS_PORT
from .autolabels.worker.inference import Cluener
from .autolabels.worker.tasks import autolabel_infer
from .autolabels.worker.tasks import model_cache as ner_model_cache


async def startup(ctx: Any) -> None:
    ner_model_cache["cluener"] = Cluener().model


class WorkerSettings:
    functions = [autolabel_infer]
    redis_settings = RedisSettings(host=REDIS_HOST, port=REDIS_PORT)

    on_startup = startup

    max_jobs = 2
    job_timeout = 600
