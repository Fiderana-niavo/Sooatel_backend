# syntax=docker/dockerfile:1

# --- Stage 1: Build & Dependencies ---
FROM node:22-slim AS build
WORKDIR /app

# Install dependencies without running fragile external binary download scripts (sharp)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts \
  && node -e "require('fs').writeFileSync('node_modules/sharp/lib/index.js', 'module.exports = {};')"

# Copy TypeScript configuration and sources
COPY tsconfig.json ./
COPY src ./src

# Cache directory for HuggingFace / Xenova embedding models
ENV TRANSFORMERS_CACHE=/app/.cache
RUN mkdir -p /app/.cache

# Compile TypeScript, preserve chatbot knowledge documents, and pre-cache ONNX model
RUN npm run build \
  && mkdir -p dist/modules/chatbot/docs \
  && cp -r src/modules/chatbot/docs/. dist/modules/chatbot/docs/ \
  && (node -e "const { pipeline, env } = require('@xenova/transformers'); env.cacheDir = '/app/.cache'; pipeline('feature-extraction', 'Xenova/nomic-embed-text-v1');" || echo "Model pre-fetch skipped") \
  && npm prune --omit=dev --legacy-peer-deps --ignore-scripts \
  && node -e "require('fs').writeFileSync('node_modules/sharp/lib/index.js', 'module.exports = {};')"

# --- Stage 2: Production Runtime ---
FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV TRANSFORMERS_CACHE=/app/.cache
WORKDIR /app

# Non-root user ownership for security
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/.cache /app/.cache

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
