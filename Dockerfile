# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Enable the exact pnpm version declared by packageManager for reproducible builds.
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Copy dependency manifests first to maximize Docker layer cache hits.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy only files required for a production build.
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN pnpm build

# ─── Stage 2: Runtime (small) ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
