/**
 * 발표 모달 폼 검증 + 닫기 흐름 — edit-lesson4 / user-critical-flows 가 다루지 않는 영역.
 *
 * 보강 시나리오:
 *   1. 제목 비워두고 제출 → HTML5 required 검증 (upload 호출 안 됨)
 *   2. ESC 키로 모달 닫힘
 *   3. backdrop (modal-overlay 자체) 클릭 시 닫힘 (modal-card 영역 클릭 시는 유지)
 *   4. [취소] 버튼으로 닫힘
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe, getUploadCalls } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
});

test('제목 비워두고 제출 → HTML5 required 검증, /api/upload-game 호출 X', async ({ page }) => {
  await selectLesson(page, 4);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.evaluate(() => document.getElementById('btn-present').click());
  await expect(page.locator('#present-modal')).toBeVisible();

  // title 비워둔 채로 submit 클릭
  await expect(page.locator('#present-title-input')).toHaveValue('');
  await page.locator('#present-form button[type="submit"]').click();

  // HTML5 검증으로 form submit 차단됨 — 모달은 그대로, 성공 패널 안 뜸
  await expect(page.locator('#present-modal')).toBeVisible();
  await expect(page.locator('#present-success')).toBeHidden();

  // /api/upload-game 호출 X
  const calls = getUploadCalls(page);
  expect(calls.length).toBe(0);

  // input 의 validity.valid 가 false (required 위반)
  const valid = await page.evaluate(() => document.getElementById('present-title-input').validity.valid);
  expect(valid).toBe(false);
});

test('ESC 키로 발표 모달 닫힘', async ({ page }) => {
  await selectLesson(page, 4);
  await page.evaluate(() => document.getElementById('btn-present').click());
  await expect(page.locator('#present-modal')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#present-modal')).toBeHidden();
});

test('backdrop (modal 자체) 클릭 시 닫힘 — modal-card 영역 클릭 시는 유지', async ({ page }) => {
  await selectLesson(page, 4);
  await page.evaluate(() => document.getElementById('btn-present').click());
  const modal = page.locator('#present-modal');
  await expect(modal).toBeVisible();

  // modal-card 안 영역 클릭 → 닫히지 않음 (event.target !== modal)
  await page.locator('#present-modal .present-head').click();
  await expect(modal).toBeVisible();

  // backdrop (modal 영역 모서리) 클릭 → 닫힘.
  // 화면 좌상단(modal-overlay 의 빈 영역) 을 클릭. modal-card 가 중앙에 있으니 모서리는 backdrop.
  const box = await modal.boundingBox();
  await page.mouse.click(box.x + 10, box.y + 10);
  await expect(modal).toBeHidden();
});

test('[취소] 버튼으로 발표 모달 닫힘', async ({ page }) => {
  await selectLesson(page, 4);
  await page.evaluate(() => document.getElementById('btn-present').click());
  await expect(page.locator('#present-modal')).toBeVisible();

  await page.locator('#present-cancel').click();
  await expect(page.locator('#present-modal')).toBeHidden();
});

test('성공 후 [완료] 버튼으로 닫힘 (#present-done)', async ({ page }) => {
  await selectLesson(page, 4);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.evaluate(() => document.getElementById('btn-present').click());
  await page.locator('#present-title-input').fill('완료 버튼 테스트');
  await page.locator('#present-form button[type="submit"]').click();

  const success = page.locator('#present-success');
  await expect(success).toBeVisible({ timeout: 8_000 });

  const done = page.locator('#present-done');
  if (await done.count() > 0 && await done.isVisible()) {
    await done.click();
    await expect(page.locator('#present-modal')).toBeHidden();
  }
});
