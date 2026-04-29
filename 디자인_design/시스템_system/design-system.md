<!--
 ============================================
 📋 문서 배포 이력 (Deploy Header)
 ============================================
 @file        design-system.md
 @version     v1.0.0
 @updated     2026-04-29 (KST)
 @ordered-by  용남 대표
 @description 공도 AI-Game 디자인 시스템 통합 문서.
              에셋(PNG) 인벤토리, 디자인 토큰(컬러/폰트/스페이싱/모션),
              컴포넌트 구조, 레이아웃·접근성·확장 가이드를 한 파일로 정리.
              개발 착수 시 이 문서 한 장으로 디자인 ↔ 코드 매핑 가능.

 @sources
   - 디자인_design/브랜드_brand/palette.md  v0.1.0
   - 앱_app/공용_public/css_스타일/{reset,palette,layout,components}.css
   - 앱_app/index.html v1.2.1
   - 앱_app/에셋_assets/

 ── 변경 이력 ──────────────────────────
 v1.0.0 | 2026-04-29 | 디자인 시스템 통합 문서 최초 작성 (palette/layout/components/assets 단일 출처화)
 ============================================
-->

# 🎨 공도 AI-Game — 디자인 시스템 v1.0.0

> 초등 5–6학년 바이브코딩 실습환경의 **카툰 스타일** 디자인 시스템. 넷마블 IP(ㅋㅋ·토리·밥·레옹) 기반.
>
> **단일 출처(Single Source of Truth)**: 색상·폰트·스페이싱·모션은 모두 [palette.css](../../앱_app/공용_public/css_스타일/palette.css)의 CSS 변수로 정의. 값 변경 시 그 한 파일만 수정하면 전 화면 일괄 반영.

---

## 목차

1. [에셋 인벤토리](#1-에셋-인벤토리)
2. [디자인 토큰](#2-디자인-토큰)
3. [컴포넌트 카탈로그](#3-컴포넌트-카탈로그)
4. [레이아웃 시스템](#4-레이아웃-시스템)
5. [접근성·모션](#5-접근성모션)
6. [개발자 사용 가이드](#6-개발자-사용-가이드)

---

## 1. 에셋 인벤토리

전체 에셋은 [앱_app/에셋_assets/](../../앱_app/에셋_assets/) 아래 분류. SVG는 현재 없으며 모두 **투명 배경 PNG** 또는 JPG. 모든 이미지는 `onerror` 핸들러로 **이모지 폴백**이 걸려 있어 로드 실패 시 자동 대체된다.

### 1.1 캐릭터 — `에셋_assets/캐릭터_characters/`

| 파일 | 픽셀 | 용량 | 캐릭터 | 포즈 | 사용 위치 | 폴백 이모지 |
|:---|:---:|:---:|:---|:---|:---|:---:|
| [`kk_em.png`](../../앱_app/에셋_assets/캐릭터_characters/kk_em.png) | 274×267 | 43 KB | ㅋㅋ | 감정(em) | `#character-grid` 카드 | 🦸 |
| [`kk_idle.png`](../../앱_app/에셋_assets/캐릭터_characters/kk_idle.png) | 283×224 | 30 KB | ㅋㅋ | 대기(idle) | (게임 내 사용 예정) | 🦸 |
| [`tory_em.png`](../../앱_app/에셋_assets/캐릭터_characters/tory_em.png) | 268×273 | 30 KB | 토리 | 감정 | `#character-grid` 카드 | 👒 |
| [`tory_idle.png`](../../앱_app/에셋_assets/캐릭터_characters/tory_idle.png) | 348×217 | 37 KB | 토리 | 대기 | (게임 내 사용 예정) | 👒 |
| [`bob_em.png`](../../앱_app/에셋_assets/캐릭터_characters/bob_em.png) | 244×249 | 41 KB | 밥 | 감정 | `#character-grid` 카드 | 🐰 |
| [`bob_idle.png`](../../앱_app/에셋_assets/캐릭터_characters/bob_idle.png) | 257×181 | 24 KB | 밥 | 대기 | (게임 내 사용 예정) | 🐰 |
| [`leon_em.png`](../../앱_app/에셋_assets/캐릭터_characters/leon_em.png) | 297×239 | 33 KB | 레옹 | 감정 | `#character-grid` 카드 | 🦁 |
| [`leon_idle.png`](../../앱_app/에셋_assets/캐릭터_characters/leon_idle.png) | 172×177 | 22 KB | 레옹 | 대기 | (게임 내 사용 예정) | 🦁 |
| [`gongdossem.png`](../../앱_app/에셋_assets/캐릭터_characters/gongdossem.png) | 512×512 | 81 KB | 공도쌤 | 마스코트 | 튜터 FAB / 드로어 헤더 / 생성 모달 / 튜터 메시지 | 🦸 |
| [`welcome_love.png`](../../앱_app/에셋_assets/캐릭터_characters/welcome_love.png) | 400×228 | 71 KB | — | 환영 일러 | `.placeholder-love` (게임 영역 초기 화면) | 🚀 |
| [`archive/old_*.png`](../../앱_app/에셋_assets/캐릭터_characters/archive/) | — | — | (구버전) | — | **사용 금지** (참조용 보관) | — |

**네이밍 규칙**: `{캐릭터}_{포즈}.png`
- `_em` = emotion (감정·표정 포즈, 카드용)
- `_idle` = idle (대기 포즈, 게임 인게임용)

**파일 사이즈 운영 규칙**: 카드 노출용 최대 84 KB(현재 모두 충족), 폭/높이 ~256–300 px 권장.

### 1.2 배경 — `에셋_assets/배경_backgrounds/`

| 파일 | 픽셀 | 용량 | 용도 |
|:---|:---:|:---:|:---|
| [`worldmap_1920.jpg`](../../앱_app/에셋_assets/배경_backgrounds/worldmap_1920.jpg) | 1472×1920 | 442 KB | 데스크톱 전체화면 배경 |
| [`worldmap_640.jpg`](../../앱_app/에셋_assets/배경_backgrounds/worldmap_640.jpg) | 490×640 | 74 KB | 모바일·저해상 폴백 |

> **현재 index.html에서 직접 사용되지 않음** — 차후 `<picture srcset>` 또는 CSS `image-set()` 으로 적용 예정.

### 1.3 샘플 게임 — `에셋_assets/샘플게임_samples/`

| 파일 | 용량 | 용도 |
|:---|:---:|:---|
| [`shooter_demo.html`](../../앱_app/에셋_assets/샘플게임_samples/shooter_demo.html) | 19 KB | 1차시 슈터 데모(iframe로 `.pane-game`에 삽입 가능) |

### 1.4 SVG 인라인 자산

별도 SVG 파일은 없고, **인라인 SVG**로만 사용:

| 위치 | 용도 | viewBox |
|:---|:---|:---:|
| [`index.html` `.countdown-svg`](../../앱_app/index.html#L505-L508) | 30초 쿨다운 모달의 진행 링 (배경/전경 `<circle r=45>`) | `0 0 100 100` |
| `.theme-swatch` (인라인 `<span>`) | 테마 카드 미리보기 그라데이션 — `linear-gradient(135deg, …)` | — |

### 1.5 이모지 사용 정책

이모지는 **장식·폴백·공간 절약**을 위한 1차 시각 요소. 다음 두 가지 패턴을 일관되게 사용한다.

| 패턴 | 예시 | 의미 |
|:---|:---|:---|
| `<span aria-hidden="true">▶</span>` | 버튼 내 아이콘 | 스크린리더 무시, 시각 강조용 |
| `<img onerror="this.replaceWith(...emoji)">` | 캐릭터 카드 | PNG 로드 실패 시 이모지로 자동 대체 |

**대표 이모지 사전**:
🎮 로고 · ▶ 시작 · 📤 발표 · ❓ 도움말 · 📚 폴더 · 📝 문서 · 👾 게임 · 🦸 공도쌤(폴백) · 🎨 배경 · 🎵 음악 · 🔓 활성화 · 🔒 잠금 · ↻ 리셋 · 🔍 코드 보기 · ✕ 닫기 · ✓ 확인 · 🌟 보상 · 🌌🌋🌳🌊 테마

---

## 2. 디자인 토큰

모두 `:root` CSS 변수. 정의 위치: [`palette.css`](../../앱_app/공용_public/css_스타일/palette.css).

### 2.1 색상 (8색 + 파생 + 그레이)

#### 브랜드 8색 (ㅋㅋ 캐릭터 기반)

| 변수 | HEX | 미리보기 | 역할 | 주 사용처 |
|:---|:---|:---:|:---|:---|
| `--color-red` | `#E63946` | 🔴 | 메인 액션 / CTA | `.btn-primary`, `[시작]`, FAB, 잠금해제 |
| `--color-yellow` | `#F7C548` | 🟡 | 하이라이트 / 성공 | `.btn-secondary`, 진행 표시, 호버 강조, 코드뷰 헤더 |
| `--color-green` | `#8FA957` | 🟢 | 보조 / 완료 | 적용 배지, 성공 상태 (≥18px 텍스트만) |
| `--color-blue` | `#3D7BA3` | 🔵 | 정보 / 포커스 | `:focus-visible` 아웃라인, 링크 |
| `--color-brown` | `#5B3A22` | 🟤 | 본문 텍스트 / 토스트 BG | 모든 주요 텍스트, `.app-footer`, `.character-toast` |
| `--color-black` | `#1A1A1A` | ⚫ | 카툰 아웃라인 | 모든 `border` / `box-shadow` 의 기본색 |
| `--color-cream` | `#FFF8EC` | ⚪ | 전체 배경 / 카드 바탕 | `body`, `.modal-card`, `.btn-ghost` |
| `--color-pink` | `#F48FA0` | 🩷 | 서브 강조 | 진행 게이지 그라데이션, 토리 IP |

#### 파생 색상

| 변수 | HEX | 용도 |
|:---|:---|:---|
| `--color-red-dark` | `#C62E39` | `.btn-primary:hover`, FAB hover |
| `--color-red-light` | `#F06571` | (예약) |
| `--color-brown-soft` | `#8A6849` | 보조 텍스트, 점선 보더, placeholder |
| `--color-cream-deep` | `#F5EDD6` | 카드 내부 강조면 (`.character-card`, `.theme-card`, `.code-view-code-section`) |

#### 그레이 스케일

| 변수 | HEX | 용도 |
|:---|:---|:---|
| `--color-gray-50` | `#FAF6EC` | `.game-viewport` 배경, focus 입력란 |
| `--color-gray-100` | `#EFE8D6` | `.btn-ghost:hover`, 진행바 트랙, `is-locked` 버튼 BG |
| `--color-gray-300` | `#C9C0AC` | (예약) |
| `--color-gray-500` | `#8A8676` | 비활성 텍스트, footnote |

#### WCAG 2.1 콘트라스트 검증

| 전경 × 배경 | 비율 | 등급 | 정책 |
|:---|:---:|:---:|:---|
| Brown × Cream | 7.82:1 | ✅ AAA | 본문 텍스트 표준 |
| Red × Cream | 4.58:1 | ✅ AA | CTA 버튼 OK |
| Blue × Cream | 4.81:1 | ✅ AA | 링크·포커스 OK |
| Green × Cream | 3.12:1 | ⚠️ AA Large | **18px+ 텍스트만**, 배지 면적은 OK |
| Yellow × Cream | 1.76:1 | ❌ Fail | **텍스트 금지**, 배경·아이콘 전용 |
| Cream × Red | 4.58:1 | ✅ AA | `[시작]` 흰글씨 OK |

### 2.2 타이포그래피

```css
--font-body: 'Nanum Gothic', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
--font-code: 'D2Coding', 'Menlo', 'Consolas', monospace;
```

> ⚠️ [`palette.md`](../브랜드_brand/palette.md#L72-L75) 사양에는 "나눔스퀘어 라운드"로 명시되었으나 실제 [`index.html`](../../앱_app/index.html#L37) 은 Google Fonts에서 `Nanum Gothic` 만 로드 중. **차기 패치 항목**.

#### 폰트 크기 스케일

| 변수 | 값 | 사용처 |
|:---|:---:|:---|
| `--fs-xs` | 12px | 푸터, 트리 파일, 힌트 |
| `--fs-sm` | 14px | 토글, 부가 설명, 입력 |
| `--fs-md` | 16px | 본문 표준 |
| `--fs-lg` | 18px | 페인 타이틀, FAB 라벨 |
| `--fs-xl` | 22px | 헤더 로고, 드로어 헤더 아바타 |
| `--fs-2xl` | 28px | 모달 타이틀, 게임 시작 오버레이 |
| `--fs-3xl` | 36px | 카운트다운 숫자 |

폰트 굵기는 **400 / 700 / 800** 3단계만 사용 (Nanum Gothic 로드 weight = 400, 700, 800).

### 2.3 스페이싱·레이아웃·라운드·그림자

#### 스페이싱 (4px 기반 8단계)

| 변수 | 값 | 용도 |
|:---|:---:|:---|
| `--space-1` | 4px | 미세 갭 |
| `--space-2` | 8px | 인라인 갭 |
| `--space-3` | 12px | 카드 내부 패딩, 입력 |
| `--space-4` | 16px | 섹션 패딩 |
| `--space-5` | 20px | 에디터 패딩, 드로어 본문 |
| `--space-6` | 24px | 모달 패딩, 헤더 가로 |
| `--space-8` | 32px | 모달 큰 패딩 |

#### 라운드

| 변수 | 값 | 용도 |
|:---|:---:|:---|
| `--radius-sm` | 8px | 트리 파일, 작은 칩 |
| `--radius-md` | 12px | 버튼·카드·입력 표준 |
| `--radius-lg` | 16px | 모달, 드로어, 튜터 말풍선 |

#### 카툰 아웃라인 & 오프셋 그림자

```css
--outline-width: 3px;
--outline-color: var(--color-black);
--shadow-toon-sm:    2px 2px 0 var(--color-black);   /* 기본 */
--shadow-toon:       4px 4px 0 var(--color-black);   /* hover */
--shadow-toon-hover: 6px 6px 0 var(--color-black);   /* 강조 hover */
```

**카툰 hover 패턴** (`.btn`, `.toolbar-btn`, FAB 등 공통):
```css
:hover  { transform: translate(-2px, -2px); box-shadow: var(--shadow-toon); }
:active { transform: translate(0, 0);       box-shadow: var(--shadow-toon-sm); }
```

#### 레이아웃 변수

| 변수 | 값 | 용도 |
|:---|:---:|:---|
| `--header-h` | 60px | `.app-header` 고정 높이 |
| `--footer-h` | 28px | `.app-footer` 고정 높이 |
| `--tutor-h` | 200px | (예약 — 하단 도킹 모드) |
| `--tutor-h-expanded` | 40vh | (예약) |

### 2.4 모션

| 변수 | 값 | 용도 |
|:---|:---|:---|
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | 표준 이징 (Material standard) |
| `--dur-fast` | 150ms | 호버, 버튼 |
| `--dur-mid` | 250ms | 모달 등장, 드로어 슬라이드 |
| `--dur-slow` | 400ms | (예약) |

#### 정의된 keyframe 라이브러리

| 이름 | 용도 | 주기 |
|:---|:---|:---|
| `fadeIn` | 모달 오버레이 | `--dur-mid` |
| `popIn` | 모달 카드 (`scale 0.8→1`) | `--dur-mid` |
| `gen-bounce` | 생성중 캐릭터 점프 | 0.9s ∞ |
| `gen-slide` | 진행바 좌→우 슬라이드 | 1.3s ∞ |
| `gen-dots` | 튜터 pending 깜빡 | 1.2s ∞ |
| `bgm-pulse` | 음악 재생 중 펄스 | 1s ∞ |
| `tutor-pulse` | FAB 외곽 노란 링 | 2.2s ∞ |
| `unlock-pulse` | 활성화 버튼 펄스 | 1.8s ∞ |
| `btn-attention-pulse` | `[시작]` 변경 신호 | 1.4s ∞ |
| `btn-attention-dot-pulse` | 빨간 점 뱃지 | 1.4s ∞ |
| `btn-highlight` | 음악 적용 후 1회 강조 | 0.5s × 3 |
| `editor-flash` | 문서 변경 알림 | 1.8s |
| `sparkle` | 모달 이모지 회전 | 1.5s ∞ |
| `float` | 환영 이미지 부유 | 2s ∞ |
| `codeInfoFade` | 코드뷰 안내 등장 | 0.2s |

> `prefers-reduced-motion: reduce` 시 모든 애니메이션 0.01ms로 무력화 ([layout.css:393-398](../../앱_app/공용_public/css_스타일/layout.css#L393-L398)).

---

## 3. 컴포넌트 카탈로그

각 컴포넌트는 **HTML 마크업 → 핵심 CSS 클래스 → 변형(modifier) → 위치** 형식으로 정리.

### 3.1 버튼

#### 기본 `.btn` (헤더·모달 액션)

```html
<button class="btn btn-primary">▶ 시작</button>
<button class="btn btn-secondary">📤 발표자료</button>
<button class="btn btn-ghost">❓ 도움말</button>
```

| 변형 | 배경 | 글자 | 호버 |
|:---|:---|:---|:---|
| `.btn-primary` | red | cream | red-dark |
| `.btn-secondary` | yellow | brown | `#EDBA38` |
| `.btn-ghost` | cream | brown | gray-100 |

**상태 modifier**: `:disabled` / `.btn-attention`(시선 유도 펄스) / `.btn-highlight-pulse`(1회 강조 ×3) / 자식 `.btn-attention-dot`(빨간 점 뱃지) / `.btn-music-badge`(녹색 🎵 미니뱃지)

#### 도구바 `.toolbar-btn` (에디터 상단)

```html
<button class="toolbar-btn">↻ <span class="toolbar-btn-label">처음으로</span></button>
```

- 기본 배경 = yellow, 토글된 상태 (`aria-expanded="true"` / `aria-pressed="true"`) = red
- **컨테이너 쿼리**: `.pane-editor` 폭 ≤ 460px → `.toolbar-btn-label` 숨김 (이모지만)
- **잠금 게이트**: `.toolbar-btn.is-locked` (회색 + `pointer-events:none`) + `.toolbar-btn-wrapper`(클릭 캡처)
- **활성화 트리거**: `.toolbar-btn-unlock` (red + `unlock-pulse`)

### 3.2 모달 (`.modal-overlay` + `.modal-card`)

```html
<div class="modal-overlay" hidden role="dialog" aria-modal="true">
  <div class="modal-card">
    <div class="modal-emoji">🌟</div>
    <h2 class="modal-title">제목</h2>
    <p class="modal-desc">설명</p>
    ...
  </div>
</div>
```

| ID | 카드 변형 | 용도 |
|:---|:---|:---|
| `#cooldown-modal` | (기본) | 30초 쿨다운 — `.countdown-ring` 포함 |
| `#generating-modal` | `.generating-card` | AI 생성중 — `.gen-character`/`.gen-progress`/`.gen-timer`/`.gen-message` |
| `#present-modal` | `.present-card` | 발표자료 폼 + 성공 패널(`.present-success`) |
| `#character-unlock-modal` | `.character-unlock-card` | 캐릭터 활성화 키워드 입력 |
| `#bgm-unlock-modal` | `.character-unlock-card` | 음악 활성화 |
| `#theme-unlock-modal` | `.character-unlock-card` | 배경 활성화 |
| `#variant-unlock-modal` | `.character-unlock-card` | 예시 활성화 |

**공통 진입 애니메이션**: 오버레이 `fadeIn` + 카드 `popIn`.

### 3.3 팝오버 (`.character-popover` 베이스)

도구바 버튼 아래 **absolute 위치**의 미니 다이얼로그. 베이스 + 변형 클래스 조합.

```html
<div class="character-popover variant-popover" hidden role="dialog">…</div>
```

| 변형 | 폭 | 내용 |
|:---|:---:|:---|
| `.character-popover` (기본) | 360px | 캐릭터 4종 그리드 (`.character-grid`) |
| `.theme-popover` | 420px | 배경 테마 4종 그리드 (`.theme-grid`) |
| `.bgm-popover` | 380px | 기본 음악 + AI 음악 폼 (`.bgm-section` × 2) |
| `.variant-popover` | 360px | 예시 게임 변형 리스트 (`.variant-grid`) |
| `.reset-confirm-popover` | 280–360px | 초기화 확인 |

내부 공통: `.character-popover-head` (제목 + ✕), `.character-popover-footnote`(작은 주석).

### 3.4 카드 그리드

#### 캐릭터 카드 `.character-card`

```html
<button class="character-card" data-char="kk">
  <img class="character-img" src="…/kk_em.png" alt="ㅋㅋ 캐릭터">
  <span class="character-name">ㅋㅋ</span>
  <span class="character-desc">용감 장난꾸러기</span>
</button>
```

- 격자: `.character-grid` (2열 grid, gap = 12px)
- 사이즈: 카드 min-h 204px, 이미지 102×102px
- hover: 배경 yellow + translate

#### 테마 카드 `.theme-card`

```html
<button class="theme-card" data-theme="space">
  <span class="theme-emoji">🌌</span>
  <span class="theme-name">우주</span>
  <span class="theme-desc">…</span>
  <span class="theme-swatch" style="background: linear-gradient(135deg,#0a0e27,#1a1f4d,#4a5198)"></span>
</button>
```

- 격자: `.theme-grid` (2열, min-h 140px)
- `.theme-swatch` = 8px 높이의 그라데이션 미리보기 바

#### 변형 카드 `.variant-card`

- 단일 컬럼 리스트, 좌측 정렬
- `.is-active` 시 yellow 배경

### 3.5 드로어 트리 (좌측 차시 폴더)

```html
<ul class="drawer-tree">
  <li class="tree-folder">
    <button class="tree-toggle" aria-expanded="false">
      <span class="caret">▶</span>
      <span class="folder-emoji">📚</span>
      <div class="tree-toggle-title">
        제목<span class="tree-toggle-subtitle">부제</span>
      </div>
    </button>
    <ul class="tree-children">
      <li class="tree-file">하위 항목</li>
    </ul>
  </li>
</ul>
```

| 클래스 | 상태 | 시각 |
|:---|:---|:---|
| `.tree-folder.is-open` | 펼침 | `.tree-children` `display: flex` + caret 90도 회전 |
| `.tree-file:hover` | — | cream 배경 + brown-soft 보더 |
| `.tree-file.is-active` | 선택 | red 배경 + cream 글자 |
| `.tree-folder.is-disabled` | 비활성(manifest gating) | `opacity:0.45` + `grayscale(0.6)` + `not-allowed` |

구분선 `.drawer-divider`, 섹션 타이틀 `.drawer-section-title`.

### 3.6 BGM 패널 (`.bgm-popover`)

| 영역 | 클래스 | 비고 |
|:---|:---|:---|
| 섹션 헤더 | `.bgm-section-title` / `.bgm-section-desc` | — |
| 기본 음악 버튼 | `.bgm-btn-play` (재생 중 → red + `bgm-pulse`) | — |
| AI 입력 폼 | `.bgm-ai-form` / `.bgm-ai-input` / `.bgm-btn-generate` | `:focus` → red 보더 |
| 상태 메시지 | `.bgm-ai-status` (`.is-success` 녹색 / `.is-error` 빨강) | `aria-live` |
| 토글·적용 | `.bgm-ai-actions` 안의 `.bgm-action-btn` | 토글 = ⏹ 정지 |
| 적용 진행 | `.bgm-apply-progress` (yellow + `gen-bounce` 스피너) | — |
| 적용 완료 배지 | `.bgm-applied-badge` (green + ✕ 클리어) | `[시작]` 옆 `.btn-music-badge` 와 연동 |

### 3.7 코드 보기 오버레이 `#code-view-overlay`

`.pane-editor` 위에 **absolute** 로 덮는 read-only 코드 뷰어.

```
.code-view-overlay
├── .code-view-header  (yellow, ✕ close 44×44)
├── .code-view-warn    (변경사항 안내)
├── .code-view-md-section   40%   ← 학생 문서
│   ├── .code-view-section-header
│   └── .code-view-md      (마크다운: .md-h2/.md-h3/.md-li/.md-p/.md-hr)
└── .code-view-code-section 60%   ← 진짜 코드
    ├── .code-view-section-header.code-view-section-header-code
    ├── .code-view-info       (3초 안내)
    └── .code-view-body
        └── .code-view-pre > code
            ├── .code-line[.is-highlight]  (섹션 하이라이트)
            ├── x-c   (커스텀 element: 주석, italic + yellow tint)
            └── x-k   (커스텀 element: 키워드, 800)
```

모바일(≤767px) → md/code 비율 30/70.

### 3.8 AI튜터 (FAB + 우측 드로어)

#### FAB `.tutor-fab`

```html
<button class="tutor-fab" aria-expanded="false">
  <img class="tutor-fab-avatar mascot-img" src="…/gongdossem.png">
  <span class="tutor-fab-label">AI튜터</span>
  <span class="tutor-fab-pulse"></span>
</button>
```

- 위치: `position: fixed; right: 24px; bottom: 24px;`
- 모양: 76×96 둥근 사각 (계란형 `border-radius`)
- 외곽 노란 링: `.tutor-fab-pulse` (`tutor-pulse` 2.2s ∞)
- 드로어 열림 시 `aria-expanded="true"` → `opacity: 0; scale(0.6)` 로 사라짐

#### 드로어 `.tutor-drawer`

- 위치: 우측 고정, 폭 360px, 높이 = `100vh - header - footer`
- 진입: `transform: translateX(100%)` → `.is-open` 시 `translateX(0)`
- 열림 시 `body.has-tutor-open .app-main { padding-right: 360px; }` 로 본문 시프트

| 영역 | 클래스 |
|:---|:---|
| 헤더 | `.drawer-head` (yellow) + `.drawer-head-avatar`(red 원) + `.drawer-close`(cream 원) |
| 메시지 | `.tutor-messages` > `.tutor-message` > `.tutor-avatar` + `.tutor-bubble` |
| 입력폼 | `.tutor-input-form` > `.tutor-input` + `.btn.tutor-send` |
| 힌트 뱃지 | `.tutor-hint-badge` (yellow, hover red) / `.is-search` 변형 |
| pending | `.tutor-bubble.is-pending` (`gen-dots` 깜빡) |

### 3.9 에디터 (`#editor-textarea` + mirror)

```html
<div class="editor-textarea-wrapper">
  <textarea class="editor-textarea editor-textarea-with-mirror"></textarea>
  <div class="editor-mirror">…<mark class="editor-hero-mark">바뀐 줄</mark>…</div>
</div>
```

- **mirror div 기법**: 동일 폰트/패딩으로 깔린 div 위에 `<mark>` 로 IP 변경 라인을 노란색 강조. textarea는 `background: transparent`.
- `.editor-textarea.is-flashing` — 1.8s 노란 깜빡 (변경 알림)
- `.editor-textarea.is-locked-prompt` — readonly 시각(cream-deep + caret 숨김)
- `::selection` → yellow 배경

### 3.10 게임 영역 `.pane-game`

```html
<section class="pane pane-game">
  <div class="pane-toolbar">…</div>
  <div class="game-viewport">
    <div class="game-placeholder">
      <img class="placeholder-love" src="welcome_love.png">
      <p class="placeholder-text">게임을 기다리고 있어요</p>
    </div>
    <!-- 실행 시 -->
    <iframe class="game-iframe"></iframe>
    <!-- 첫 시작 안내 -->
    <button class="game-start-overlay">…</button>
  </div>
</section>
```

- placeholder: `.placeholder-love`(이미지) 또는 `.placeholder-emoji`(폴백)에 `float` 애니메이션
- iframe: `var(--outline-width)` 검은 보더 + `--shadow-toon`
- 시작 오버레이: 반투명 검정 BG + `.game-start-emoji`(`gen-bounce`) + yellow 타이틀

### 3.11 부유 안내 — 토스트 / 배너

| 컴포넌트 | 위치 | 트리거 |
|:---|:---|:---|
| `.character-toast` | 화면 상단 중앙 fixed | 활성화 성공 / readonly 안내 (`.is-shown` 토글) |
| `.narrow-screen-banner` | 상단 fixed (yellow) | 폭 ≤768px (`body.is-narrow-screen`) → 본문 56px 시프트 |
| `.skip-link` | top -40px → focus 시 0 | 스크린리더용 “본문으로 건너뛰기” |

---

## 4. 레이아웃 시스템

### 4.1 전체 구조 (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│ .app-header  (60px, cream, 3px black bottom border)         │
│   🎮 공도 AI-Game        [❓도움말][▶시작][📤발표자료]         │
├──────┬──────────────────────────┬──┬────────────────────────┤
│      │                          │  │                        │
│ 📚   │ 📝 .pane-editor          │░░│ 👾 .pane-game          │
│ 폴더 │   ┌──────────────────┐   │░░│   ┌──────────────────┐ │
│      │   │ .pane-toolbar    │   │░░│   │ .pane-toolbar    │ │
│      │   │ (2-row 도구바)   │   │░░│   ├──────────────────┤ │
│      │   ├──────────────────┤   │░░│   │ .game-viewport   │ │
│      │   │ #editor-textarea │   │░░│   │   (iframe / love)│ │
│      │   │  + .editor-mirror│   │░░│   │                  │ │
│ 20%  │   └──────────────────┘   │  │   └──────────────────┘ │
│      │   flex 1, min 420px      │  │   flex 1, min 520px    │
│      │                          │6 │                        │
├──────┴──────────────────────────┴px┴────────────────────────┤
│ .app-footer (28px, brown bg, cream 텍스트)                   │
└─────────────────────────────────────────────────────────────┘
                                          ┌──┐
                                          │🦸│ ← .tutor-fab (76×96)
                                          └──┘
```

- 좌측 `.pane-drawer`: **고정 20%**, cream-deep 배경
- 우측 두 패널: **flex 1 1 auto**, 가운데 `.resize-handle`(6px, red on hover)로 드래그 리사이즈
- 우측 슬라이드 `.tutor-drawer` 열림 시 `.app-main` 에 `padding-right: 360px`

### 4.2 반응형

| 폭 | 모드 | 변화 |
|:---|:---|:---|
| ≥1024px | **데스크톱 4-pane** | 위 도식 그대로 |
| ≤1024px | **탭 모드** | `.pane` 모두 `display: none`, `.is-active-tab` 만 `flex`. 상단 노란 안내 바 표시 |
| ≤1180px | 좁은 에디터 | `.pane-editor.is-narrow .toolbar-btn-label` 숨김 (컨테이너 쿼리 폴백) |
| ≤768px | **PC 권장 안내** | `.narrow-screen-banner` 표시 + body 56px shift |
| ≤767px | 코드뷰 | md 30% / code 70% 비율 |
| 컨테이너 ≤460px | 도구바 | label 숨김(이모지만) |

---

## 5. 접근성·모션

### 5.1 ARIA / 시맨틱 일관 규칙

- 최상위: `role="banner"` / `role="main"` / `role="contentinfo"`
- 모달: `role="dialog" aria-modal="true" aria-labelledby="…" aria-describedby="…"`
- 팝오버: `role="dialog" aria-label="…"` (모달 아님)
- 토글 버튼: `aria-expanded` / `aria-pressed` / `aria-controls`
- 라이브 영역: `.tutor-messages[role="log"][aria-live="polite"]`, `.bgm-ai-status[aria-live="polite"]`, 토스트 `role="status"`
- 장식 이모지: `aria-hidden="true"`
- 입력 라벨: 폼 바깥 사용 시 `<label class="sr-only">`
- `:focus-visible` → 3px blue outline + 2px offset

### 5.2 터치·포인터 사이즈

- 모달 ✕ 닫기: `.code-view-close` **44×44** (모바일 AC-NFR-7)
- 도구바·트리: 최소 32px 높이 권장 (현재 패딩 8–12px + 폰트 14px)

### 5.3 모션 정책

- 전역: 모든 호버는 카툰 패턴 통일 (translate -2/-2, shadow up)
- 펄스 / 무한 애니메이션: BGM 재생, FAB, 활성화 트리거 등 **상태 진행 중** 또는 **시선 유도** 한정
- 무한 애니메이션은 항상 `prefers-reduced-motion`으로 무력화 가능

---

## 6. 개발자 사용 가이드

### 6.1 단일 출처 변경 매트릭스

| 바꾸고 싶은 것 | 수정 파일 | 비고 |
|:---|:---|:---|
| 색상 (hue/대비) | [`palette.css`](../../앱_app/공용_public/css_스타일/palette.css) | `--color-*` 만 |
| 라운드·그림자·아웃라인 | `palette.css` | `--radius-*`, `--shadow-toon*`, `--outline-*` |
| 폰트·크기 | `palette.css` + [`index.html`](../../앱_app/index.html#L37) `<link>` | 폰트 추가 시 둘 다 |
| 스페이싱 | `palette.css` | `--space-*` |
| 모션 속도 | `palette.css` | `--dur-*`, `--ease` |
| 헤더/푸터 높이 | `palette.css` | `--header-h`, `--footer-h` |
| 패널 비율 / 반응형 | [`layout.css`](../../앱_app/공용_public/css_스타일/layout.css) | `.pane-*` 폭, `@media` |
| 컴포넌트 시각 | [`components.css`](../../앱_app/공용_public/css_스타일/components.css) | 컴포넌트별 섹션 분리 |

### 6.2 새 컴포넌트 추가 체크리스트

1. **HEX 직접 쓰지 않기** — 모든 색은 `var(--color-*)`
2. **카툰 패턴 따르기** — `border: var(--outline-width) solid var(--outline-color); border-radius: var(--radius-md); box-shadow: var(--shadow-toon-sm);`
3. **호버는 표준 트랜잭션** — `transform: translate(-2px,-2px); box-shadow: var(--shadow-toon);`
4. **이모지 + 폴백** — 이미지 사용 시 `onerror="this.replaceWith(...emoji)"` 필수
5. **접근성** — 인터랙티브 요소엔 `aria-label` 또는 보이는 라벨, 토글엔 `aria-expanded`
6. **모션 옵트아웃** — 무한 애니메이션은 `@media (prefers-reduced-motion: reduce)` 자동 무력화 됨 (전역 규칙으로 커버)

### 6.3 새 캐릭터 추가 절차

1. 파일 추가: `에셋_assets/캐릭터_characters/{name}_em.png` + `{name}_idle.png`
2. 권장 사양: 투명 배경 PNG, 폭 ~256–300px, **84KB 이하**
3. [`index.html` `#character-grid`](../../앱_app/index.html#L149-L182) 에 `<li>` 1개 추가:

```html
<li>
  <button type="button" class="character-card"
          data-char="새이름" data-label="라벨"
          data-file="새이름_idle.png" data-emoji="🦊">
    <img class="character-img" src="./에셋_assets/캐릭터_characters/새이름_em.png" alt="새이름 캐릭터"
         onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'character-emoji',textContent:'🦊'}))">
    <span class="character-name">라벨</span>
    <span class="character-desc">한줄 설명</span>
  </button>
</li>
```

4. (옵션) 색상이 시스템 8색에서 크게 벗어나면 [`palette.md`](../브랜드_brand/palette.md) 갱신 검토

### 6.4 새 배경 테마 추가 절차

[`index.html` `#theme-grid`](../../앱_app/index.html#L190-L231) 에 `data-colors` 3색을 지정한 카드 추가:

```html
<li>
  <button class="theme-card" data-theme="키"
          data-label="라벨" data-desc="설명"
          data-colors="#hex1,#hex2,#hex3">
    <span class="theme-emoji">🌅</span>
    <span class="theme-name">라벨</span>
    <span class="theme-desc">설명</span>
    <span class="theme-swatch" style="background: linear-gradient(135deg,#hex1,#hex2,#hex3)"></span>
  </button>
</li>
```

테마 색상은 게임 iframe 내부에 `data-colors` 로 전달되어 적용됨(앱 로직).

### 6.5 알려진 미해결 / 후속 작업

- [ ] **폰트 정합성**: [`palette.md`](../브랜드_brand/palette.md#L72-L75) “나눔스퀘어 라운드” 명시 ↔ 실제 `Nanum Gothic` 로드. 둘 중 하나로 통일 필요.
- [ ] **배경 worldmap 미사용**: `worldmap_*.jpg` 가 현재 어디에도 참조되지 않음. 의도된 보류인지 확인.
- [ ] **SVG 자산 0개**: 사용자가 SVG 정리를 요청했으나 프로젝트에는 인라인 SVG(카운트다운 링) 외 외부 SVG 파일이 없음. 향후 아이콘 SVG 도입 시 이 문서 §1.4 갱신.
- [ ] **`--color-red-light`, `--color-gray-300`, `--tutor-h*`**: 정의는 되어 있으나 미사용 — 사용처 확정 또는 정리.
- [ ] **`palette.md` v0.1.0 → 정식**: 최AR 의 `넷마블프렌즈 매뉴얼 v2.0.ai` 추출 후 ±5% 재검증 대기 중.

---

## 부록 A — 파일별 책임 요약

| 파일 | 라인 수 | 책임 |
|:---|:---:|:---|
| [`reset.css`](../../앱_app/공용_public/css_스타일/reset.css) | 29 | 박스모델 리셋, `.sr-only`, `.skip-link`, `:focus-visible` |
| [`palette.css`](../../앱_app/공용_public/css_스타일/palette.css) | 71 | **모든 디자인 토큰** (색·폰트·간격·라운드·그림자·모션·레이아웃) |
| [`layout.css`](../../앱_app/공용_public/css_스타일/layout.css) | 398 | 헤더·푸터·4-pane·리사이즈·튜터 FAB/드로어·반응형 |
| [`components.css`](../../앱_app/공용_public/css_스타일/components.css) | 1864 | 위에 열거한 모든 컴포넌트 |
| [`index.html`](../../앱_app/index.html) | 612 | 마크업 단일 페이지 (모든 모달·팝오버 인라인) |

## 부록 B — 빠른 참조 치트시트

```css
/* 표준 카툰 카드 */
.my-card {
  background: var(--color-cream);
  color:      var(--color-brown);
  border:     var(--outline-width) solid var(--outline-color);
  border-radius: var(--radius-md);
  box-shadow:    var(--shadow-toon-sm);
  padding:       var(--space-3);
  font-family:   var(--font-body);
  font-size:     var(--fs-md);
  transition: transform var(--dur-fast) var(--ease),
              box-shadow var(--dur-fast) var(--ease);
}
.my-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-toon);
}
.my-card:active {
  transform: translate(0, 0);
  box-shadow: var(--shadow-toon-sm);
}
```

---

*본 문서는 [`디자인_design/브랜드_brand/palette.md`](../브랜드_brand/palette.md), [`palette.css`](../../앱_app/공용_public/css_스타일/palette.css), [`layout.css`](../../앱_app/공용_public/css_스타일/layout.css), [`components.css`](../../앱_app/공용_public/css_스타일/components.css), [`index.html`](../../앱_app/index.html), [`에셋_assets/`](../../앱_app/에셋_assets/) 의 현재 상태를 한 화면에 정리한 스냅샷입니다. 토큰·컴포넌트 변경 시 이 문서도 함께 업데이트해주세요.*
