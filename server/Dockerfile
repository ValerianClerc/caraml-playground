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

## --- Emscripten stage: pull official pre-built toolchain ---
FROM emscripten/emsdk:4.0.15 AS emsdk

## --- Runtime stage: start from caraml base (has caraml toolchain) ---
FROM vclerc/caraml:latest AS runtime
LABEL org.opencontainers.image.source="https://github.com/ValerianClerc/caraml-playground" \
	org.opencontainers.image.description="Server runtime with caraml + Node app + emscripten toolchain" \
	org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production \
	PORT=3000 \
	TZ=Etc/UTC

# Copy only the needed emsdk components from the official image to minimize size.
# You can remove node/ python bits if base already supplies equivalents.
COPY --from=emsdk /emsdk /opt/emsdk

# (Optional) prune tests & large caches to slim image (keep sanity cache minimal)
RUN rm -rf /opt/emsdk/upstream/emscripten/tests || true \
	&& find /opt/emsdk -type f -name "*.pyc" -delete || true

# Environment variables equivalent to sourcing emsdk_env.sh
ENV EMSDK=/opt/emsdk \
	PATH="/opt/emsdk:/opt/emsdk/upstream/emscripten:/opt/emsdk/node/22.16.0_64bit/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"

# Verify emcc availability early (non-fatal if just prints) - helps build logs.
RUN emcc --version | head -n1

# Prewarm emscripten cache (libc, system libs) to avoid first-request latency/hangs.
# Uses reduced optimization for speed; runtime builds can still use higher -O levels.
RUN echo 'int main(){return 0;}' > /tmp/warmup.c \
	&& emcc /tmp/warmup.c -O1 -s WASM=1 -s NO_FILESYSTEM=1 -s ENVIRONMENT=web -o /tmp/warmup.js \
	&& rm -f /tmp/warmup.c /tmp/warmup.js /tmp/warmup.wasm

# Provide Node from build stage (if you prefer the one from toolchain you can skip this copy)
COPY --from=build /usr/local/bin/node /usr/local/bin/node

WORKDIR /app

# Copy application artifacts & production dependencies
COPY --from=prod-deps /app/package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD ["node", "-e", "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

ENTRYPOINT ["node", "dist/index.js"]
