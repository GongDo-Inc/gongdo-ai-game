#!/usr/bin/env bash
# 공도 AI-Game — Secret Manager 시크릿 최초 등록 스크립트
# 사용법:  ./setup-secrets.sh
#         (대화형으로 키별 값을 입력받아 Secret Manager 에 등록)
#
# .env.local 파일이 있으면 그 값을 자동으로 읽어와서 등록합니다.
# 이미 등록된 시크릿은 건너뜁니다 (덮어쓰려면 --update 옵션 사용).

set -euo pipefail

UPDATE=false
[[ "${1:-}" == "--update" ]] && UPDATE=true

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ PROJECT_ID 가 설정되지 않았습니다."
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")"

# Secret Manager API 활성화
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID" --quiet

# 등록할 시크릿 목록
SECRETS=(
  "ANTHROPIC_API_KEY"
  "OPENAI_API_KEY"
  "KV_REST_API_URL"
  "KV_REST_API_TOKEN"
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
)

# .env.local 자동 로드 (있는 경우)
if [[ -f .env.local ]]; then
  echo "📄 .env.local 발견 — 값을 자동 추출합니다."
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

for name in "${SECRETS[@]}"; do
  exists=false
  if gcloud secrets describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    exists=true
  fi

  if [[ "$exists" == "true" && "$UPDATE" == "false" ]]; then
    echo "✅ $name (이미 등록됨, 건너뜀 — 덮어쓰려면 ./setup-secrets.sh --update)"
    continue
  fi

  # .env.local 에 값이 있으면 그것을 사용, 없으면 사용자에게 입력 요청
  value="${!name:-}"
  if [[ -z "$value" ]]; then
    read -r -s -p "🔑 $name 값 입력 (입력 시 화면에 안 보임): " value
    echo
    if [[ -z "$value" ]]; then
      echo "⏭  빈 값 — $name 건너뜁니다."
      continue
    fi
  else
    echo "📥 $name 값을 .env.local 에서 가져옵니다."
  fi

  if [[ "$exists" == "true" ]]; then
    echo -n "$value" | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID" --quiet
    echo "🔄 $name 갱신됨"
  else
    echo -n "$value" | gcloud secrets create "$name" --data-file=- --project="$PROJECT_ID" --quiet
    echo "✨ $name 신규 등록됨"
  fi
done

echo ""

# ── Cloud Run 기본 서비스 계정에 Secret Accessor 권한 부여 ──────────
# Cloud Run 의 default compute service account 가 Secret Manager 시크릿을
# 런타임에 읽으려면 'roles/secretmanager.secretAccessor' 권한 필요.
echo "🔐 Cloud Run 서비스 계정에 Secret 접근 권한 부여 중…"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None \
  --quiet >/dev/null
echo "✅ ${SA} 에 secretAccessor 권한 부여 완료"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 시크릿 등록 완료. 이제 ./deploy.sh 로 배포하세요."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
