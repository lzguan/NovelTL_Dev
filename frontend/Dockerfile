FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV npm_config_store_dir=/pnpm/store
ENV CI=true

RUN groupadd -r -g 1001 newuser && useradd -u 1001 -ms /bin/bash newuser -g newuser

RUN npm install --global corepack@latest --force
RUN corepack enable pnpm
RUN mkdir /home/newuser/.pnpm-store/v11 -p && chown newuser:newuser /home/newuser/.pnpm-store -R
RUN chown newuser:newuser /home/newuser -R
USER newuser

WORKDIR /home/newuser


COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/home/newuser/.pnpm-store,uid=1001,gid=1001 pnpm install --frozen-lockfile --force

COPY . .
EXPOSE 5173
CMD pnpm run dev
