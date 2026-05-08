import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('3차시 — 학생이 도시 도착 시 [구입]/[지나가기] 모달 표시', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 3);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  // 게임 로드 후 player(human) 를 강제로 도시 칸(idx 1, 서울) 으로 이동시키고 handleCityCell 호출
  await frame.evaluate(() => {
    const human = window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman);
    human.pos = 1;  // 서울 (도시 칸)
    window.__GONGDO_MARBLE_TEST__.handleCityCell(human, window.__GONGDO_MARBLE_TEST__.CELLS[1], () => {});
  });

  // 모달이 나타남 — "매입하시겠습니까" 텍스트 확인
  const modal = frame.locator('.modal').filter({ hasText: '매입하시겠습니까' });
  await expect(modal).toBeVisible({ timeout: 3000 });
  await expect(modal).toContainText('서울');
  // [✅ 구입] 과 [지나가기] 버튼 존재
  await expect(modal.locator('button').filter({ hasText: '구입' })).toBeVisible();
  await expect(modal.locator('button').filter({ hasText: '지나가기' })).toBeVisible();
});

test('3차시 — [✅ 구입] 클릭 시 gold 차감 + ownerId 등록', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 3);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  await frame.evaluate(() => {
    const human = window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman);
    human.pos = 1;
    window.__BUY_DONE__ = false;
    window.__GONGDO_MARBLE_TEST__.handleCityCell(human, window.__GONGDO_MARBLE_TEST__.CELLS[1], () => { window.__BUY_DONE__ = true; });
  });

  const modal = frame.locator('.modal').filter({ hasText: '매입하시겠습니까' });
  const initialGold = await frame.evaluate(() => window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman).gold);

  await modal.locator('button').filter({ hasText: '구입' }).click();

  // 모달 사라짐
  await expect(modal).toBeHidden({ timeout: 2000 });
  // gold 차감, ownerId 등록
  const after = await frame.evaluate(() => ({
    gold: window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman).gold,
    ownerId: window.__GONGDO_MARBLE_TEST__.CELLS[1].ownerId,
    humanId: window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman).id,
  }));
  expect(after.gold).toBeLessThan(initialGold);
  expect(after.ownerId).toBe(after.humanId);
});

test('3차시 — [지나가기] 클릭 시 매입 안 함', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 3);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  await frame.evaluate(() => {
    const human = window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman);
    human.pos = 1;
    window.__GONGDO_MARBLE_TEST__.handleCityCell(human, window.__GONGDO_MARBLE_TEST__.CELLS[1], () => {});
  });

  const modal = frame.locator('.modal').filter({ hasText: '매입하시겠습니까' });
  const initialGold = await frame.evaluate(() => window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman).gold);

  await modal.locator('button').filter({ hasText: '지나가기' }).click();

  await expect(modal).toBeHidden({ timeout: 2000 });
  const after = await frame.evaluate(() => ({
    gold: window.__GONGDO_MARBLE_TEST__.state.players.find((p) => p.isHuman).gold,
    ownerId: window.__GONGDO_MARBLE_TEST__.CELLS[1].ownerId,
  }));
  expect(after.gold).toBe(initialGold);   // gold 그대로
  expect(after.ownerId).toBeNull();       // 매입 안 됨
});

test('1·2차시 — cityBuyChoice false → 자동 매입 (모달 X)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.ui.cityBuyChoice).toBe(false);
});
