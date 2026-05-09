# Accept build args before any FROM so they propagate through all stages (Global Scope)
ARG NEXT_PUBLIC_BACKEND_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

# ---- Dependencies stage ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --legacy-peer-deps

# ---- Builder stage ----
FROM deps AS builder
WORKDIR /app

# PHẢI GỌI LẠI ARG Ở ĐÂY THÌ MỚI LẤY ĐƯỢC DỮ LIỆU TỪ GLOBAL
ARG NEXT_PUBLIC_BACKEND_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
# Lúc này ENV mới nhận được đúng URL từ file docker-compose / .env
ENV NEXT_PUBLIC_BACKEND_BASE_URL=${NEXT_PUBLIC_BACKEND_BASE_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

RUN npx next build

# ---- Runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Cài compilers cho syntax check (python, gcc, g++, java, dotnet SDK)
RUN apk add --no-cache \
    bash \
    python3 \
    gcc \
    g++ \
    musl-dev \
    openjdk21 \
    icu-libs \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    # Cài .NET SDK bằng script chính thức (apk chỉ có runtime, không có SDK)
    && wget -q https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh \
    && chmod +x /tmp/dotnet-install.sh \
    && /tmp/dotnet-install.sh --channel 8.0 --install-dir /usr/share/dotnet \
    && ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet \
    && rm /tmp/dotnet-install.sh

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
