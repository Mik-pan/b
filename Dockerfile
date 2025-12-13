# 阶段1: 安装依赖
FROM node:20-alpine AS deps
# Prisma 在 Alpine 上需要 OpenSSL（Node 20 的 alpine 基础镜像已是 OpenSSL 3 系列）
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install --include=dev; fi
RUN npx prisma generate

# 阶段2: 构建
FROM node:20-alpine AS builder
# next build 期间会执行到 Prisma（例如 SSG/数据收集），需要与 deps 阶段一致的 OpenSSL
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_PUBLIC_SITE_URL=https://www.miklog.space
RUN npm run build

# 阶段3: 生产运行
FROM node:20-alpine AS runner
# 运行期 Prisma Query Engine 也依赖 OpenSSL
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_URL=https://www.miklog.space

# 复制 standalone 输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
