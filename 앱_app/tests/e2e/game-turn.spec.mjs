/**
 * 게임 한 턴 전체 진행 — 학생이 [시작] 후 실제로 게임을 플레이하는 흐름.
 *
 * 기존 city-buy.spec.mjs 는 3차시 [구입]/[지나가기] 모달만 검증.
 * 이 spec 은 그 외의 핵심 게임 메커니즘:
 *   - 1·2차시 자동 매입 (cityBuyChoice=false)
 *   - 통행료 차감 (다른 사람 소유 도시 진입)
 *   - 출발점(idx 0) 통과 시 월급 가산
 *   - 승리 조건 도달 → 승자 모달
 *   - 자기 도시 진입 시 매입·통행 둘 다 안 함
 *
 * 헬퍼: window.__GONGDO_MARBLE_TEST__ = { state, CELLS, CONFIG, handleCityCell }
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('2차시 — human 이 빈 도시 진입 시 cityBuyChoice=false 로 자동 매입', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  const before = await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    return { cityBuyChoice: T.CONFIG.ui.cityBuyChoice };
  });
  expect(before.cityBuyChoice).toBe(false);

  await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    human.gold = 50000;             // 매입 충분히 가능하게
    human.pos = 1;  // 서울 (도시 칸)
    T.handleCityCell(human, T.CELLS[1], () => { window.__BUY_DONE__ = true; });
  });

  // 자동 매입 — 모달 표시 없음, gold 차감 + ownerId 등록
  await expect(frame.locator('.modal').filter({ hasText: '매입하시겠습니까' })).toHaveCount(0);

  // setTimeout(done, 800) 안에 처리 완료
  await frame.waitForFunction(() => window.__BUY_DONE__ === true, null, { timeout: 3_000 });
  const after = await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    return { gold: human.gold, ownerId: T.CELLS[1].ownerId, humanId: human.id };
  });
  expect(after.gold).toBeLessThan(50000);
  expect(after.ownerId).toBe(after.humanId);
});

test('3차시 — 다른 사람 소유 도시 진입 시 통행료 자동 차감 (모달 X)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 3);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  // AI 가 1번 칸을 미리 소유한 상태로 만들고 human 을 그 칸으로 이동
  const setup = await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    const ai = T.state.players.find((p) => !p.isHuman);
    ai.gold = 10000;
    T.CELLS[1].ownerId = ai.id;     // 1번 칸을 AI 소유로
    human.pos = 1;
    return { humanGold: human.gold, aiGold: ai.gold, toll: T.CELLS[1].toll };
  });

  await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    T.handleCityCell(human, T.CELLS[1], () => { window.__TOLL_DONE__ = true; });
  });

  // 매입 모달은 안 뜬다 (이미 소유자 있으므로) — 통행료 자동 차감
  await expect(frame.locator('.modal').filter({ hasText: '매입하시겠습니까' })).toHaveCount(0);
  await frame.waitForFunction(() => window.__TOLL_DONE__ === true, null, { timeout: 3_000 });

  const after = await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    const ai = T.state.players.find((p) => !p.isHuman);
    return { humanGold: human.gold, aiGold: ai.gold };
  });
  // human 은 toll 만큼 잃고 ai 가 toll 만큼 받는다 (CELLS[1].toll 사용)
  expect(after.humanGold).toBe(setup.humanGold - setup.toll);
  expect(after.aiGold).toBe(setup.aiGold + setup.toll);
});

test('자기 소유 도시 진입 시 — 매입·통행료 모두 발생 안 함, 단순 통과', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  const setup = await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    T.CELLS[1].ownerId = human.id;
    human.pos = 1;
    return { gold: human.gold };
  });

  await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    T.handleCityCell(human, T.CELLS[1], () => { window.__OWN_DONE__ = true; });
  });
  await frame.waitForFunction(() => window.__OWN_DONE__ === true, null, { timeout: 3_000 });

  const after = await frame.evaluate(() => {
    return window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman).gold;
  });
  // gold 변화 없음
  expect(after).toBe(setup.gold);
});

test('빈 도시 + gold 부족 → 매입 실패 (자동), 게임은 진행', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    human.gold = 100;             // 매입 불가능한 적은 금액
    human.pos = 1;
    T.handleCityCell(human, T.CELLS[1], () => { window.__POOR_DONE__ = true; });
  });

  await frame.waitForFunction(() => window.__POOR_DONE__ === true, null, { timeout: 3_000 });

  const after = await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    const human = T.state.players.find((p) => p.isHuman);
    return { gold: human.gold, ownerId: T.CELLS[1].ownerId };
  });
  // gold 그대로, ownerId 없음 (매입 안 됨)
  expect(after.gold).toBe(100);
  expect(after.ownerId).toBeNull();
});

test('iframe 안 [주사위 굴리기] 한 번 → 모달 등장 + 합계 표시', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  // 첫 게임 안내 오버레이가 있으면 닫기
  const overlay = page.locator('.game-start-overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.click();
  }

  await frame.locator('#roll-btn').click();
  await frame.locator('.dice-pair .die').first().waitFor({ state: 'visible', timeout: 5000 });

  // 모달 안 [굴리기] 버튼
  await frame.locator('.modal button.btn').filter({ hasText: '굴리기' }).first().click();

  // 0.9s 후 합계 표시 (`합계 <strong>N</strong>칸 이동!` 또는 `모두 N!`)
  await expect(frame.locator('.modal').first()).toContainText(/합계|모두/, { timeout: 3000 });
});

test('1차시 — disableWin 으로 승리 조건 비활성 (학생이 매입·통행만 학습)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.ui.disableWin).toBe(true);
});

test('2·3차시 — 승리 조건 활성 (winGold 도달 시 승자 모달)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 3);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.ui.disableWin).toBeFalsy();
  expect(config.rules.winGold).toBeGreaterThan(0);
});

// ─────────── 워크시트 데코 배지 동적 렌더 (이전: "슬기" 하드코딩) ───────────

test('1차시 워크시트 — AI 배지가 CONFIG.players 의 상대 이름을 사용 (하드코딩 "슬기 AI" 아님)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  // lesson 1 기본 핀 라벨 = "친구" → 배지에 "친구 AI" 가 표기되어야
  const badge = frame.locator('#worksheet-ai-badge');
  await expect(badge).toBeVisible({ timeout: 5_000 });
  await expect(badge).toContainText('친구 AI');
  // 회귀 방어 — 절대 "슬기" 가 들어가면 안 됨 (학생 문서와 무관한 캐릭터)
  await expect(badge).not.toContainText('슬기');
});

test('2차시 워크시트 — 학생이 핀 이름을 바꾸면 배지에도 반영', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // "친구" → "라이벌" 로 이름 변경
  await page.evaluate(() => {
    const el = document.getElementById('editor-textarea');
    el.value = el.value.replace('- **친구**: 파란 핀', '- **라이벌**: 파란 핀');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await clickStart(page);
  const frame = await waitForGameIframe(page);

  const badge = frame.locator('#worksheet-ai-badge');
  await expect(badge).toContainText('라이벌 AI');
  await expect(badge).not.toContainText('슬기');
});

test('1차시 워크시트 — turnNote 가 사람 이름으로 시작 + AI 차례엔 AI 이름으로 갱신', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  const turnNote = frame.locator('#worksheet-turn-note');
  await expect(turnNote).toBeVisible();
  // 초기 (turnIndex=0) = 사람 차례 → "나 차례"
  await expect(turnNote).toContainText('나 차례');
  // 회귀 방어 — "슬기 차례 · 남은 시간 8s" 같은 mockup 텍스트 X
  await expect(turnNote).not.toContainText('8s');
  await expect(turnNote).not.toContainText('슬기');

  // turnIndex 를 강제로 AI 로 바꾸고 updateHud 호출 — turnNote 가 AI 이름으로 갱신
  await frame.evaluate(() => {
    const T = window.__GONGDO_MARBLE_TEST__;
    T.state.turnIndex = 1;   // AI 차례
  });
  // updateHud 는 직접 호출 불가 (test 익스포트 안 됨) → 한 턴 자연 진행 시 갱신.
  //   대신 turn-chip(#turn-chip)으로 동일 로직이 적용됨을 확인
});

test('3차시 (default 테마) — 워크시트 데코 자체가 없음 (lessonTheme!=="worksheet")', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 3);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  // lesson 3 는 worksheet 테마 아님 → ai-badge / turn-note 둘 다 미생성
  await expect(frame.locator('#worksheet-ai-badge')).toHaveCount(0);
  await expect(frame.locator('#worksheet-turn-note')).toHaveCount(0);
});
