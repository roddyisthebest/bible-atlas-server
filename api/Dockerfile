# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
# Yarn 사용 준비
RUN corepack enable
# 의존성 설치
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
# 소스 복사 & 빌드
COPY . .
RUN yarn build

# ---- Runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
# 프로덕션 의존성만
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production
# 빌드 산출물만 배포
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
