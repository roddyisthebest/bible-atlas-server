# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

# 전체 복사(옵션 COPY로 고통받지 말자)
COPY . .

# npm lock만 있을 때는 yarn.lock을 생성(import), 있으면 그대로 사용
RUN if [ -f package-lock.json ] && [ ! -f yarn.lock ]; then yarn import; fi \
 && if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else yarn install; fi \
 && yarn build

# ---- Runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# package.json + (빌더에서 생성/존재하는) yarn.lock 가져오기
COPY package.json ./
COPY --from=builder /app/yarn.lock ./yarn.lock

# 프로덕션 의존성만 설치 (lock 있으면 엄격, 없으면 일반 설치)
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile --production=true; else yarn install --production=true; fi

# 빌드 산출물만 복사
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
