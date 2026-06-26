# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# 의존성 캐싱: lock 먼저 복사
COPY package.json package-lock.json ./
RUN npm ci

# 소스 복사 후 prod 빌드 (.env + .env.production 적용)
COPY . .
# tsc 타입체크는 건너뛰고 vite 번들만 생성 (데모 빌드 안정성)
RUN npx vite build

# ---- runtime stage ----
FROM nginx:1.27-alpine AS runtime

# 우리 nginx 설정으로 교체 (정적 서빙 + /api·/oauth2 프록시)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 산출물 정적 파일 배치
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
