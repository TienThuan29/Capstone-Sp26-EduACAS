# Accept build args before any FROM so they propagate through all stages (Global Scope)
ARG NEXT_PUBLIC_BACKEND_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

# ---- Dependencies stage ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY web_app/package.json web_app/package-lock.json* ./

RUN npm install --legacy-peer-deps

# ---- Builder stage ----
FROM deps AS builder
WORKDIR /app

# PHẢI GỌI LẠI ARG Ở ĐÂY THÌ MỚI LẤY ĐƯỢC DỮ LIỆU TỪ GLOBAL
ARG NEXT_PUBLIC_BACKEND_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

COPY web_app/. .

ENV NEXT_TELEMETRY_DISABLED 1
# Lúc này ENV mới nhận được đúng URL từ file docker-compose / .env
ENV NEXT_PUBLIC_BACKEND_BASE_URL=${NEXT_PUBLIC_BACKEND_BASE_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

RUN npx next build

# ---- Runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Cài compilers cho syntax check (python, gcc, g++, java, dotnet)
RUN apk add --no-cache \
    python3 \
    gcc \
    g++ \
    musl-dev \
    openjdk21 \
    dotnet8 \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Gọi lại ARG nếu bạn muốn biến này tồn tại ở runtime (tuỳ chọn nhưng nên có)
ARG NEXT_PUBLIC_BACKEND_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_BACKEND_BASE_URL=${NEXT_PUBLIC_BACKEND_BASE_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
