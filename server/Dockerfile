## --- Build stage: start from official Node for reliable deterministic Node + npm ---
FROM node:20.11.1-bookworm-slim AS build
LABEL org.opencontainers.image.source="https://github.com/ValerianClerc/caraml-playground" \
	  org.opencontainers.image.description="Server build stage for caraml-playground (npm)" \
	  org.opencontainers.image.licenses="MIT"

ENV DEBIAN_FRONTEND=noninteractive \
	TZ=Etc/UTC

RUN apt-get update && apt-get install -y --no-install-recommends \
	  git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests first (leverage caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install all deps (including dev) deterministically using lockfile
RUN npm ci

# Copy source
COPY src ./src

RUN npm run build

## Stage to produce production-only node_modules using npm prune (avoid reinstall cost)
FROM build AS prod-deps
RUN npm prune --omit=dev

## --- Runtime stage: start from caraml base (has caraml toolchain) ---
FROM vclerc/caraml:latest AS runtime
LABEL org.opencontainers.image.source="https://github.com/ValerianClerc/caraml-playground" \
			org.opencontainers.image.description="Server runtime with caraml + Node app" \
			org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production \
		PORT=3000 \
		TZ=Etc/UTC

## Copy only the Node runtime binary (no global npm tree to reduce image size)
COPY --from=build /usr/local/bin/node /usr/local/bin/node
ENV PATH="/usr/local/bin:/usr/bin:/bin"

WORKDIR /app

# Copy application artifacts & production dependencies
COPY --from=prod-deps /app/package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD ["node", "-e", "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

ENTRYPOINT ["node", "dist/index.js"]
