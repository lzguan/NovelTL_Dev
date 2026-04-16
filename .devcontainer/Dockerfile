FROM mcr.microsoft.com/devcontainers/base:trixie

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV npm_config_store_dir=/home/vscode/.pnpm-store


WORKDIR /project-deps
# uv
COPY --from=ghcr.io/astral-sh/uv:0.10.9 /uv /uvx /bin/
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

ENV UV_PROJECT_ENVIRONMENT="/.venv"
RUN mkdir -p /.venv && chown vscode:vscode /.venv
RUN apt-get update && apt-get install -y postgresql-common && \
    yes | /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh && \
    apt-get install -y postgresql-client-18 && \
    rm -rf /var/lib/apt/lists/*
COPY backend/pyproject.toml backend/uv.lock* ./backend/
RUN chown vscode:vscode ./backend/pyproject.toml ./backend/uv.lock
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN chown vscode:vscode ./package.json ./pnpm-lock.yaml
RUN mkdir -p /home/vscode/.cache && chown vscode:vscode /home/vscode/.cache
RUN mkdir -p /home/vscode/.pnpm-store && chown vscode:vscode /home/vscode/.pnpm-store
RUN chown vscode:vscode /pnpm -R
RUN chown vscode:vscode /project-deps -R


USER vscode

WORKDIR /project-deps/backend
RUN --mount=type=cache,target=/home/vscode/.cache/uv,uid=1000,gid=1000 uv sync --all-groups --no-install-project
# pnpm
WORKDIR /project-deps/frontend
RUN --mount=type=cache,id=pnpm,target=/home/vscode/.pnpm-store,uid=1000,gid=1000 pnpm install
WORKDIR /project-deps
