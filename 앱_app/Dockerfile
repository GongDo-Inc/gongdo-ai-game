# 공도 AI-Game — Cloud Run 컨테이너 이미지
# 빌드 컨텍스트는 앱_app/ 한 폴더로 한정. 정적 파일 + /api/* 핸들러를 dev-server.js 가 한 프로세스로 서빙.

FROM node:20-alpine AS base
WORKDIR /app

# 의존성만 먼저 설치 → 코드 변경 시 캐시 재사용
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 앱 소스 복사 (.dockerignore 가 dev/, docs/, .git 등 제외)
COPY . .

# Cloud Run 은 PORT 환경변수를 자동 주입(보통 8080). dev-server.js 가 이를 그대로 사용.
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dev-server.js"]
