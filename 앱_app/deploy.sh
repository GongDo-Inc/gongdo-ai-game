#!/usr/bin/env bash
# 공도 AI-Game — Cloud Run 배포 스크립트
# 사용법:  ./deploy.sh                          (기본 설정으로 배포)
#         PROJECT_ID=my-proj ./deploy.sh        (프로젝트 오버라이드)
#         REGION=us-central1 ./deploy.sh        (리전 오버라이드)
#
# 사전 준비:
#   1) gcloud auth login
#   2) gcloud config set project YOUR_PROJECT_ID
#   3) gcloud services enable run.googleapis.com cloudbuild.googleapis.com
#   4) ./setup-secrets.sh (시크릿 최초 1회 등록)

set -euo pipefail

# ── 설정 (env 로 오버라이드 가능) ─────────────────────
SERVICE="${SERVICE:-gongdo-ai-game}"
REGION="${REGION:-asia-northeast3}"
MEMORY="${MEMORY:-512Mi}"
CPU="${CPU:-1}"
MIN_INSTANCES="${MIN_INSTANCES:-0}"
MAX_INSTANCES="${MAX_INSTANCES:-5}"
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

# ── 시크릿 매핑 (Secret Manager 등록 후 사용) ─────────
# 형식: ENV_VAR=SECRET_NAME:VERSION
SECRETS=(
  "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest"
  "KV_REST_API_URL=KV_REST_API_URL:latest"
  "KV_REST_API_TOKEN=KV_REST_API_TOKEN:latest"
  "SUPABASE_URL=SUPABASE_URL:latest"
  "SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest"
)
# 등록되지 않은 시크릿은 자동으로 제외하여 배포 실패 방지
SECRETS_FLAG=""
for entry in "${SECRETS[@]}"; do
  name="${entry##*=}"
  name="${name%:*}"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    SECRETS_FLAG="${SECRETS_FLAG:+$SECRETS_FLAG,}$entry"
  else
    echo "⚠️  시크릿 '$name' 가 등록되지 않아 제외합니다 (./setup-secrets.sh 로 등록)"
  fi
done

# ── 사전 검증 ──────────────────────────────────────
if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ PROJECT_ID 가 설정되지 않았습니다. 'gcloud config set project ...' 또는 PROJECT_ID=... 으로 지정"
  exit 1
fi
if ! command -v gcloud >/dev/null 2>&1; then
  echo "❌ gcloud CLI 가 설치되지 않았습니다. https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# 스크립트 디렉토리(=앱_app)로 이동 (어디서 실행해도 안전)
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Cloud Run 배포 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  서비스       : $SERVICE"
echo "  프로젝트     : $PROJECT_ID"
echo "  리전         : $REGION"
echo "  메모리/CPU   : $MEMORY / $CPU"
echo "  인스턴스     : $MIN_INSTANCES ~ $MAX_INSTANCES"
echo "  시크릿       : ${SECRETS_FLAG:-(없음)}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 배포 ──────────────────────────────────────────
DEPLOY_ARGS=(
  "run" "deploy" "$SERVICE"
  "--source" "."
  "--project" "$PROJECT_ID"
  "--region" "$REGION"
  "--allow-unauthenticated"
  "--memory" "$MEMORY"
  "--cpu" "$CPU"
  "--min-instances" "$MIN_INSTANCES"
  "--max-instances" "$MAX_INSTANCES"
  "--quiet"
)
if [[ -n "$SECRETS_FLAG" ]]; then
  DEPLOY_ARGS+=("--set-secrets" "$SECRETS_FLAG")
fi

gcloud "${DEPLOY_ARGS[@]}"

# ── 결과 URL 출력 ─────────────────────────────────
URL=$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)' 2>/dev/null || true)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 배포 완료"
echo "🌐 $URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
