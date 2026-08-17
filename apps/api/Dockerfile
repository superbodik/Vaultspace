# Build from the repo root: docker build -f apps/api/Dockerfile -t vaultspace-api .
FROM node:22-slim AS build
WORKDIR /repo

# Both workspace package.json files are copied up front (even though only api
# is built here) so `npm ci` sees a complete workspace tree matching the
# lockfile — installing from just one workspace's package.json while the
# other is still missing on disk makes npm ci reject the lockfile as out of sync.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/api apps/api
RUN npm run db:generate --workspace apps/api
RUN npm run build --workspace apps/api

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN mkdir -p uploads
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
