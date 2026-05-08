/**
 * E2E 공통 유틸 — AI 호출 mock, lesson 선택, 시작 클릭 등.
 *
 * 핵심 방침:
 *   - 모든 외부 AI/Storage 호출은 page.route() 로 mock → 결정론적·빠름·무비용
 *   - 실제 검증 대상은 UI 흐름·DOM 상태·iframe 안 게임 로직
 */

// 1×1 투명 PNG (가장 작은 valid PNG, ~70 bytes base64)
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==';

const MOCK_GAME_HTML = `<!DOCTYPE html><html><head><title>mock-game</title></head>
<body><div id="mock-game">MOCK GENERATED GAME</div></body></html>`;

/**
 * 모든 AI/외부 호출을 mock — 페이지 로드 전에 호출.
 */
export async function setupMocks(page) {
  // /api/chat — mode 별 분기
  await page.route('**/api/chat', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const mode = body.mode || 'generator';
    const base = { rateLimit: { used: 1, limit: 100, resetInSec: 60 } };
    if (mode === 'tutor') {
      // 질문 키워드에 따라 적절한 HINT 반환 (실제 Claude SYSTEM_TUTOR 동작 시뮬레이션)
      const q = String(body.document || '');
      let hint = '### 도시 목록'; // default
      if (/보드 색상|보드색|배경색|보드.{0,3}색/i.test(q)) hint = '## 보드 색상';
      else if (/주사위|주사위.{0,5}바꾸/.test(q)) hint = '### 주사위';
      else if (/핀|색깔|color/i.test(q)) hint = '### 플레이어 핀';
      else if (/주인공|캐릭터/.test(q)) hint = '### 주인공';
      else if (/음악|bgm/i.test(q)) hint = '### 음악';
      else if (/도시|city/i.test(q)) hint = '### 도시 목록';
      return route.fulfill({ json: { ...base, reply: `좋은 질문이에요! 🌟 [HINT:${hint}]` } });
    }
    if (mode === 'dice') {
      return route.fulfill({
        json: { ...base, dice: { label: 'mock 주사위', emoji: '🐕', theme: 'classic' } },
      });
    }
    if (mode === 'pin_colors') {
      return route.fulfill({
        json: { ...base, pins: [{ color: '#FF5577' }, { color: '#55AAFF' }] },
      });
    }
    if (mode === 'board_color') {
      return route.fulfill({
        json: { ...base, board: { stageColor: '#EFE8D6', backgroundColor: '#FFE5B4' } },
      });
    }
    // generator mode — return mock game HTML
    return route.fulfill({ json: { ...base, html: MOCK_GAME_HTML, htmlExtractStatus: 'ok' } });
  });

  // /api/lesson-background — board / dice 이미지
  await page.route('**/api/lesson-background', (route) => {
    return route.fulfill({
      json: {
        imageUrl: `data:image/png;base64,${TINY_PNG_B64}`,
        promptUsed: 'mock',
        model: 'mock-model',
      },
    });
  });

  // /api/music — mock 악보
  await page.route('**/api/music', (route) => {
    return route.fulfill({
      json: {
        score: { tempo: 120, mood: 'mock', melody: [], bass: [], drums: [] },
        rateLimit: { used: 1, limit: 5, resetInSec: 60 },
      },
    });
  });

  // /api/upload-game — Supabase mock 응답. uploadCalls 배열에 페이로드 누적.
  page._uploadCalls = [];
  await page.route('**/api/upload-game', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    page._uploadCalls.push(body);
    return route.fulfill({
      json: {
        ok: true,
        url: 'http://localhost/api/play?id=mock-id',
        id: 'mock-id',
        size: body?.html ? body.html.length : 0,
      },
    });
  });
}

/** setupMocks 후 발생한 /api/upload-game 호출 페이로드 배열 */
export function getUploadCalls(page) {
  return page._uploadCalls || [];
}

/**
 * AI 튜터 drawer 열고 N번 질문 보내기.
 * 매 응답 후 마지막 bot 메시지가 화면에 추가될 때까지 대기.
 */
export async function askTutor(page, question) {
  const fab = page.locator('#tutor-fab');
  if (await fab.isVisible()) {
    // drawer 가 닫혀있으면 열기
    const drawerOpen = await page.locator('#tutor-drawer.is-open').isVisible().catch(() => false);
    if (!drawerOpen) await fab.click();
  }
  await page.locator('#tutor-input').fill(question);
  // 현재 bot 메시지 수
  const before = await page.locator('.tutor-message.tutor-message-bot').count();
  await page.locator('#tutor-form button[type="submit"]').click();
  // 새 bot 메시지가 추가될 때까지 (pending '...' 가 아닌 실제 응답)
  await page.waitForFunction(
    (prev) => {
      const all = document.querySelectorAll('.tutor-message.tutor-message-bot');
      if (all.length <= prev) return false;
      // 가장 최신 메시지가 pending 이 아니어야
      const last = all[all.length - 1];
      return !last.dataset.pending;
    },
    before,
    { timeout: 5_000 }
  );
}

/** 에디터 텍스트의 특정 라인을 새 텍스트로 교체 — 인계·input 이벤트 발생 */
export async function replaceEditorLine(page, oldSubstr, newSubstr) {
  await page.evaluate(({ a, b }) => {
    const el = document.getElementById('editor-textarea');
    if (!el.value.includes(a)) throw new Error(`replaceEditorLine: "${a}" not found`);
    el.value = el.value.replace(a, b);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, { a: oldSubstr, b: newSubstr });
}

export async function selectLesson(page, lessonNo) {
  // tree-folder 가 닫혀있으면 toggle 먼저 → fileBtn 노출 후 클릭
  const folder = page.locator(`#drawer-lessons .tree-folder[data-lesson="${lessonNo}"]`);
  const isOpen = await folder.evaluate((el) => el.classList.contains('is-open'));
  if (!isOpen) {
    await folder.locator('.tree-toggle').click();
  }
  const fileBtn = folder.locator('.tree-file');
  await fileBtn.click();
  // 에디터에 lesson 본문이 로드될 때까지 대기 (placeholder 사라질 때까지)
  await page.waitForFunction(
    () => {
      const v = document.getElementById('editor-textarea')?.value || '';
      return v.length > 0 && !v.includes('문서를 불러오는 중');
    },
    { timeout: 10_000 }
  );
}

export async function getEditorValue(page) {
  return page.evaluate(() => document.getElementById('editor-textarea')?.value || '');
}

export async function setEditorValue(page, text) {
  await page.evaluate((t) => {
    const el = document.getElementById('editor-textarea');
    el.value = t;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
}

export async function clickStart(page) {
  await page.locator('#btn-start').click();
}

/**
 * 마블 게임 iframe 이 DOM 에 붙고 안에서 CONFIG 가 주입될 때까지 대기.
 * 첫 게임 안내 오버레이가 있으면 자동으로 닫음 (이후 모달 클릭 가로채기 방지).
 * 반환: Playwright Frame (evaluate, content 등 사용 가능)
 */
export async function waitForGameIframe(page) {
  const iframeLocator = page.locator('#game-viewport iframe.game-iframe');
  await iframeLocator.waitFor({ state: 'attached', timeout: 20_000 });
  const handle = await iframeLocator.elementHandle();
  const frame = await handle.contentFrame();
  // 내부 IIFE 가 실행 완료될 때까지 (CONFIG 주입 + state/CELLS 노출) 대기
  await frame.waitForFunction(
    () => typeof window.__GONGDO_MARBLE_CONFIG__ === 'object' && window.__GONGDO_MARBLE_CONFIG__,
    null,
    { timeout: 15_000 }
  );
  // 부모 페이지의 첫 게임 안내 오버레이 닫기 — modal 클릭 가로챔 방지
  const overlay = page.locator('.game-start-overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.click().catch(() => {});
  }
  return frame;
}
