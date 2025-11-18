# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

# 프로젝트 전체 복사
COPY . .

# npm lock만 있고 yarn.lock 없으면 변환
RUN if [ -f package-lock.json ] && [ ! -f yarn.lock ]; then yarn import; fi \
 && if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else yarn install; fi \
 && yarn build

# ---- Runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# 빌더에서 산출물만 들고오기
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile --production=true; else yarn install --production=true; fi
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
