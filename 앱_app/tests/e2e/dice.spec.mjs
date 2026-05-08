import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('주사위 굴리기 모달 → .is-rolling 클래스 추가 (회전 애니메이션)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  // 첫 게임 안내 오버레이가 있으면 닫기
  const overlay = page.locator('.game-start-overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.click();
  }

  // iframe 안 [주사위 굴리기] 버튼 클릭 → openDiceModal
  await frame.locator('#roll-btn').click();
  // 모달 안 die 요소 등장
  const die = frame.locator('.dice-pair .die').first();
  await expect(die).toBeVisible({ timeout: 5000 });

  // 모달 안 [굴리기] 버튼 클릭
  await frame.locator('.modal button.btn').filter({ hasText: '굴리기' }).first().click();

  // .is-rolling 클래스가 추가됨 (애니메이션 진행 중)
  await expect(die).toHaveClass(/is-rolling/, { timeout: 2000 });

  // 0.9s 후 클래스 제거
  await page.waitForTimeout(1100);
  await expect(die).not.toHaveClass(/is-rolling/);
});

test('AI 주사위 이미지 모드 — 박스 안 die-shape-img 적용', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);

  // 주사위를 비-기본 키워드로 변경 → useAiDice 트리거
  await page.evaluate(() => {
    const el = document.getElementById('editor-textarea');
    el.value = el.value.replace('- 기본 주사위', '- 강아지 주사위');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await clickStart(page);
  const frame = await waitForGameIframe(page);

  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  // mock 응답에서 imageUrl 이 data:image/png 로 주입됨
  expect(config.dice.imageUrl).toMatch(/^data:image\/png;base64,/);
});
