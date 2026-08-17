# Build from the repo root: docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=http://localhost:4000 -t vaultspace-web .
FROM node:22-slim AS build
WORKDIR /repo

# Both workspace package.json files are copied up front (even though only web
# is built here) so `npm ci` sees a complete workspace tree matching the
# lockfile — installing from just one workspace's package.json while the
# other is still missing on disk makes npm ci reject the lockfile as out of sync.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/web apps/web

# Vite inlines VITE_* env vars into the bundle at build time, so this has to be
# a build arg (baked into the static files) rather than a runtime env var.
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace apps/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
