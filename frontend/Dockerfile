# Build stage
FROM node:20-slim as builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/client/package.json ./packages/client/
COPY packages/client/panda.config.ts ./packages/client/
COPY packages/stoat.js/package.json ./packages/stoat.js/
COPY packages/solid-livekit-components/package.json ./packages/solid-livekit-components/
COPY packages/js-lingui-solid/packages/babel-plugin-lingui-macro/package.json ./packages/js-lingui-solid/packages/babel-plugin-lingui-macro/
COPY packages/js-lingui-solid/packages/babel-plugin-extract-messages/package.json ./packages/js-lingui-solid/packages/babel-plugin-extract-messages/
COPY packages/js-lingui-solid/packages/jest-mocks/package.json ./packages/js-lingui-solid/packages/jest-mocks/

# Install dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build dependencies first
RUN pnpm build:deps

# Build frontend with root base path
RUN NODE_OPTIONS="--max-old-space-size=6144" \
    BASE_PATH=/ \
    VITE_API_URL=https://voxithub.ru/api \
    VITE_WS_URL=wss://voxithub.ru/ws \
    VITE_MEDIA_URL=https://voxithub.ru/autumn \
    VITE_PROXY_URL=https://voxithub.ru/january \
    pnpm --filter client build:prod

# Production stage with nginx
FROM nginx:alpine

# Copy built frontend
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
