FROM python:3.12-slim AS base

RUN groupadd -r -g 1001 newuser && useradd -u 1001 -ms /bin/bash newuser -g newuser

WORKDIR /home/newuser
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/home/newuser/.cache/uv,uid=1001,gid=1001 uv sync --frozen --no-default-groups --no-install-project

FROM base AS backend
RUN --mount=type=cache,target=/home/newuser/.cache/uv,uid=1001,gid=1001 uv sync --frozen --group backend --no-group worker --no-group dev --no-install-project
COPY . .
USER newuser
CMD ["uv", "run", "--no-sync", "uvicorn", "src.main:app", "--host", "0.0.0.0"]

FROM base AS worker
RUN --mount=type=cache,target=/home/newuser/.cache/uv,uid=1001,gid=1001 uv sync --frozen --group worker --no-group backend --no-group dev --no-install-project
COPY . .
USER newuser
CMD ["uv", "run", "--no-sync", "arq", "src.autolabels.worker.worker.WorkerSettings"]