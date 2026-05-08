import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe, getEditorValue } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('1차시 [▶ 시작] → 마블 게임 iframe 생성', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  await expect(frame.locator('#board')).toBeAttached({ timeout: 15_000 });
});

test('2차시 [▶ 시작] → 마블 게임 iframe + 도시 정보 주입', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  await expect(frame.locator('#board')).toBeAttached({ timeout: 15_000 });
  // CONFIG 안 cities 가 주입됐는지
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config).toBeTruthy();
  expect(Array.isArray(config.cities)).toBe(true);
  expect(config.cities.length).toBeGreaterThan(0);
});

test('3차시 [▶ 시작] → 40칸 보드 + 시작 머니 30,000', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 3);
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.board.cellCount).toBe(40);
  expect(config.rules.startGold).toBe(30000);
  expect(config.ui.cityBuyChoice).toBe(true);
  expect(config.ui.boardRotation).toBe(180);  // 출발 6시 방향
});

test('lesson 1 → lesson 2 전환 시 핀/주사위 인계', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);

  // lesson 1 의 ### 주사위 변경
  await page.evaluate(() => {
    const el = document.getElementById('editor-textarea');
    el.value = el.value.replace('- 기본 주사위', '- 강아지 주사위');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // 차시 2 로 전환
  await selectLesson(page, 2);

  // 인계된 lesson 2 본문에 강아지 주사위가 들어있는지
  const v = await getEditorValue(page);
  expect(v).toContain('강아지 주사위');
  expect(v).not.toContain('- 기본 주사위');
  // lesson 2 고유 섹션 (### 도시 목록) 은 보존
  expect(v).toContain('### 도시 목록');
});

test('lesson 2 → lesson 3 전환 시 인계 차단', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // lesson 2 보드판을 8칸으로 (lesson 3 는 40칸 고정이라 인계 X)
  await page.evaluate(() => {
    const el = document.getElementById('editor-textarea');
    el.value = el.value.replace('- 12칸 보드판', '- 8칸 보드판');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await selectLesson(page, 3);
  const v = await getEditorValue(page);
  // lesson 3 base 의 40칸이 유지 (lesson 2 의 8칸으로 덮어써지면 안 됨)
  expect(v).toContain('40칸 보드판');
  expect(v).not.toContain('8칸 보드판');
});
