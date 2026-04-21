# Build from repo root: docker build -t catalog .
# App lives in catalog/ — there is no package.json at the repository root.
FROM node:22-alpine

WORKDIR /app

COPY catalog/package.json catalog/package-lock.json ./
# `npm install` (not `npm ci`) avoids stricter lockfile checks that often fail when CI=true during image build.
RUN npm install --no-audit --no-fund && \
  ROLLUP_VER="$(node -p "require('./node_modules/vite/node_modules/rollup/package.json').version")" && \
  ARCH="$(node -p "process.arch === 'x64' ? 'x64' : process.arch === 'arm64' ? 'arm64' : process.arch")" && \
  npm install "@rollup/rollup-linux-${ARCH}-musl@${ROLLUP_VER}" --no-save

COPY catalog/ ./

ENV HOST=0.0.0.0
# Browser calls API directly (no Vite proxy). API on the host :8000 from a UI container.
# Override for other hosts: docker run -e VITE_API_URL=https://your-api.example.com/api
# Linux: add --add-host=host.docker.internal:host-gateway if host.docker.internal is missing.
ENV VITE_API_URL=http://host.docker.internal:8000/api

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
