/**
 * 3차시 PPT 수업 흐름 통합 시나리오 (PPT-2026-05-11-001)
 *
 * lesson3.md v1.4.1 기준으로 PPT 슬라이드 p7~p13 의 수업 한 바퀴를 한 테스트에서 시연.
 * 단위 테스트는 edit-lesson3.spec.mjs 에 분리되어 있고, 이 파일은 "수업 흐름 회귀" 만 본다.
 *
 * 흐름:
 *   ① lesson3 진입 (활동 1)                — 기본 문서가 핀 + 30,000골드 형식인지
 *   ② [시작] → 핀 모드 게임 진입 (활동 2-1) — 빨간/파란 핀 토큰이 보드에 뜸 (PPT p7~p8)
 *   ③ 데니스/슬기 + 50,000/10,000 편집      — 캐릭터 + 시작 금액 동시 변경 (PPT p9, p13)
 *   ④ [시작] 다시 → 캐릭터 모드 + 차등 골드 — CONFIG·HUD·DOM 전반 검증 (PPT p10)
 *   ⑤ [기본 주사위 굴리기] 1회             — 주사위 모달 → 칸 이동 → state.pos 변동 (PPT p11)
 *   ⑥ 화투패 0건 sanity                    — 게임 화면 어디에도 🎴 노출 없음
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, replaceEditorLine, clickStart, waitForGameIframe, getEditorValue } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
});

test('PPT 수업 한 바퀴 — 핀 진입 → 캐릭터+시작금액 변경 → 주사위 1회', async ({ page }) => {
  // ─────────────────────────────────────────────
  // ① 활동 1 — 3차시 문서 진입 (PPT p5)
  // ─────────────────────────────────────────────
  await selectLesson(page, 3);
  const initialDoc = await getEditorValue(page);
  // lesson3.md v1.4.1 핵심 마커 4개 — 학생이 처음 보는 문서가 핀 기본값인지
  expect(initialDoc).toContain('### 플레이어 핀');
  expect(initialDoc).toContain('- **주인공** : 빨간 핀');
  expect(initialDoc).toContain('- **AI친구** : 파란 핀');
  expect(initialDoc).toContain('- 주인공 : 30,000골드');
  expect(initialDoc).toContain('- AI친구 : 30,000골드');

  // ─────────────────────────────────────────────
  // ② 활동 2-1 — [시작] 으로 핀 모드 게임 진입 (PPT p7, p8 좌측 화면)
  // ─────────────────────────────────────────────
  await clickStart(page);
  let frame = await waitForGameIframe(page);
  // 여러 차례 clickStart 를 거치며 매번 iframe 이 교체됨. 다음 clickStart 직전에
  // 현재 iframe 을 stale 로 태깅 → 새 iframe 이 attach 될 때까지 기다리기 위함.
  const tagStaleIframe = async () => {
    await page.evaluate(() => {
      const cur = document.querySelector('#game-viewport iframe.game-iframe');
      if (cur) cur.dataset.stale = '1';
    });
  };
  const waitForFreshGameIframe = async () => {
    // 새 iframe 이 attach + CONFIG 주입될 때까지 대기 (stale 마커 없는 iframe)
    await page.waitForFunction(() => {
      const cur = document.querySelector('#game-viewport iframe.game-iframe');
      return !!cur && cur.dataset.stale !== '1';
    }, null, { timeout: 20_000 });
    return waitForGameIframe(page);
  };
  let config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);

  // CONFIG: 두 플레이어 모두 핀 모드 (pinColor 채워짐, imageUrl 비어있음)
  expect(config.players[0].name).toBe('주인공');
  expect(config.players[0].pinColor).toBeTruthy();
  expect(config.players[0].imageUrl).toBeFalsy();
  expect(config.players[1].name).toBe('AI친구');
  expect(config.players[1].pinColor).toBeTruthy();
  expect(config.players[1].imageUrl).toBeFalsy();
  expect(config.ui.usePinTokens).toBe(true);
  // 기본 시작 금액 30,000 (lesson3.md 기본값)
  expect(config.rules.startGold).toBe(30000);

  // DOM: 토큰 1️⃣ 2️⃣ 가 핀으로 보임
  await frame.waitForFunction(() => document.querySelectorAll('.token').length >= 2, null, { timeout: 10_000 });
  const pinTokens = await frame.evaluate(() => Array.from(document.querySelectorAll('.token')).map((el) => ({
    isPinToken: el.classList.contains('pin-token'),
    pinNumber: el.querySelector('.pin-inner')?.textContent || '',
    hasBackgroundImage: !!el.style.backgroundImage && el.style.backgroundImage !== 'none',
  })));
  expect(pinTokens[0].isPinToken).toBe(true);
  expect(pinTokens[0].pinNumber).toBe('1');
  expect(pinTokens[0].hasBackgroundImage).toBe(false);
  expect(pinTokens[1].isPinToken).toBe(true);
  expect(pinTokens[1].pinNumber).toBe('2');

  // ─────────────────────────────────────────────
  // ③ 활동 2-2 + 활동 3 — 캐릭터 전환 + 시작 금액 변경 (PPT p8, p9, p13)
  // ─────────────────────────────────────────────
  await replaceEditorLine(page, '- **주인공** : 빨간 핀', '- **주인공** : 데니스');
  await replaceEditorLine(page, '- **AI친구** : 파란 핀', '- **AI친구** : 슬기');
  await replaceEditorLine(page, '- 주인공 : 30,000골드', '- 주인공 : 50,000골드');
  await replaceEditorLine(page, '- AI친구 : 30,000골드', '- AI친구 : 10,000골드');

  // ─────────────────────────────────────────────
  // ④ 활동 7 — [시작] 다시 → CONFIG·HUD·DOM 전반 검증 (PPT p10)
  // ─────────────────────────────────────────────
  await tagStaleIframe();
  await clickStart(page);
  frame = await waitForFreshGameIframe();
  config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);

  // CONFIG: 캐릭터 모드 + per-player startGold
  expect(config.players[0].id).toBe('dennis');
  expect(config.players[0].name).toBe('데니스');
  expect(config.players[0].imageUrl).toMatch(/dennis\.png/);
  expect(config.players[0].startGold).toBe(50000);
  expect(config.players[1].id).toBe('seulgi');
  expect(config.players[1].name).toBe('슬기');
  expect(config.players[1].imageUrl).toMatch(/seulgi\.png/);
  expect(config.players[1].startGold).toBe(10000);
  // 글로벌 startGold = 주인공 값 (parseLesson3StartGold 사양)
  expect(config.rules.startGold).toBe(50000);
  expect(config.ui.usePinTokens).toBe(false);

  // DOM 토큰: 핀 클래스 없음 + 캐릭터 background-image
  await frame.waitForFunction(() => document.querySelectorAll('.token').length >= 2, null, { timeout: 10_000 });
  const charTokens = await frame.evaluate(() => Array.from(document.querySelectorAll('.token')).map((el) => ({
    isPinToken: el.classList.contains('pin-token'),
    backgroundImage: el.style.backgroundImage,
    hasPinInner: !!el.querySelector('.pin-inner'),
    name: el.querySelector('.token-name')?.textContent || '',
  })));
  expect(charTokens[0].isPinToken).toBe(false);
  expect(charTokens[0].backgroundImage).toMatch(/dennis\.png/);
  expect(charTokens[0].hasPinInner).toBe(false);
  expect(charTokens[0].name).toBe('데니스');
  expect(charTokens[1].backgroundImage).toMatch(/seulgi\.png/);
  expect(charTokens[1].name).toBe('슬기');

  // HUD: 50,000 / 10,000 + 주인공에만 (나) 라벨 + 첫 차례는 데니스
  await frame.waitForFunction(() => document.getElementById('gold-p0')?.textContent, null, { timeout: 10_000 });
  const hud = await frame.evaluate(() => ({
    p0Gold: document.getElementById('gold-p0')?.textContent || '',
    p1Gold: document.getElementById('gold-p1')?.textContent || '',
    p0Label: document.getElementById('label-p0')?.textContent || '',
    p1Label: document.getElementById('label-p1')?.textContent || '',
    turnChip: document.getElementById('turn-chip')?.textContent || '',
  }));
  expect(hud.p0Gold).toContain('50,000');
  expect(hud.p1Gold).toContain('10,000');
  expect(hud.p0Label).toContain('(나)');
  expect(hud.p1Label).not.toContain('(나)');
  expect(hud.turnChip).toContain('데니스');

  // ─────────────────────────────────────────────
  // ⑤ 활동 3-1 — 주사위 1회 (PPT p11)
  // ─────────────────────────────────────────────
  // 시작 위치는 0
  const startPos = await frame.evaluate(() => window.__GONGDO_MARBLE_TEST__.state.players[0].pos);
  expect(startPos).toBe(0);

  // [기본 주사위 굴리기] 클릭 → 주사위 모달이 열림 + '굴리기' 버튼 등장
  await frame.locator('#roll-btn').click();
  await frame.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('.modal .btn'));
    return btns.some((b) => (b.textContent || '').trim() === '굴리기');
  }, null, { timeout: 5_000 });

  // '굴리기' 클릭 → 900ms 애니메이션 후 버튼 텍스트가 'N칸 이동 →' 로 바뀜
  await frame.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.modal .btn'));
    btns.find((b) => (b.textContent || '').trim() === '굴리기').click();
  });
  await frame.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('.modal .btn'));
    return btns.some((b) => /\d+칸 이동/.test(b.textContent || ''));
  }, null, { timeout: 5_000 });

  // 'N칸 이동 →' 클릭 → 모달 닫히고 movePlayer 시작. 클릭 직전에 N 추출.
  const stepCount = await frame.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.modal .btn'));
    const moveBtn = btns.find((b) => /\d+칸 이동/.test(b.textContent || ''));
    const m = (moveBtn.textContent || '').match(/(\d+)칸/);
    moveBtn.click();
    return m ? Number(m[1]) : 0;
  });
  // 주사위 2개의 합 (CONFIG.rules.diceCount=2) — 2~12 사이여야 정상
  expect(stepCount).toBeGreaterThanOrEqual(2);
  expect(stepCount).toBeLessThanOrEqual(12);

  // movePlayer 가 step 당 ~420ms 씩 진행 → pos 가 stepCount 에 도달할 때까지 대기.
  // (도시·황금카드 등 후속 모달이 열릴 수 있지만 pos 전이는 모달 이전에 끝남)
  await frame.waitForFunction(
    (expected) => window.__GONGDO_MARBLE_TEST__.state.players[0].pos === expected,
    stepCount,
    { timeout: 10_000 }
  );

  // ─────────────────────────────────────────────
  // ⑥ 화투패 0건 sanity — 게임 화면 어디에도 🎴 가 없음
  // ─────────────────────────────────────────────
  const noHwatu = await frame.evaluate(() => {
    const cfg = window.__GONGDO_MARBLE_CONFIG__;
    const html = document.documentElement.innerHTML;
    return !JSON.stringify(cfg).includes('🎴') && !html.includes('🎴');
  });
  expect(noHwatu).toBe(true);
});
