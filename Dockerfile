FROM node:26-bookworm-slim
WORKDIR /app
RUN npm install --global pnpm@12.21.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY services/auth/package.json services/auth/package.json
COPY services/tracker/package.json services/tracker/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
COPY services services
