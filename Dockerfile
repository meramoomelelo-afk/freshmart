FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/db/package.json lib/db/
COPY lib/api-spec/package.json lib/api-spec/
COPY lib/api-zod/package.json lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/grocery-store/package.json artifacts/grocery-store/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .

RUN pnpm run typecheck:libs

ENV PORT=3000
ENV BASE_PATH=/
RUN pnpm --filter @workspace/grocery-store run build

RUN pnpm --filter @workspace/api-server run build

RUN cp -r artifacts/grocery-store/dist/public artifacts/api-server/dist/public

FROM base AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json

COPY --from=builder /app/lib/db ./lib/db

COPY --from=builder /app/lib/api-spec/package.json ./lib/api-spec/package.json
COPY --from=builder /app/lib/api-zod/package.json ./lib/api-zod/package.json
COPY --from=builder /app/lib/api-client-react/package.json ./lib/api-client-react/package.json

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["./start.sh"]
