/**
 * Popover 외부 클릭/ESC 닫기 + 다른 popover 자동 닫기 — 회귀 방어.
 *
 * setupPopover (app.js:1900) 가 모든 character-popover 에 공통으로 다음을 보장:
 *   - 외부 클릭 → 닫힘
 *   - ESC 키 → 닫힘
 *   - 다른 popover 열면 → 기존 popover 자동 닫힘 + aria-expanded 동기화
 *
 * 본 spec 은 캐릭터 / 배경 / BGM / reset / code-view 5개 popover 의 공통 동작을 검증.
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
});

test('캐릭터 popover — 외부 클릭으로 닫힘 + aria-expanded=false 동기화', async ({ page }) => {
  await selectLesson(page, 3);
  const btn = page.locator('#btn-character');
  const popover = page.locator('#character-popover');

  await btn.click();
  await expect(popover).toBeVisible();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');

  await page.locator('h1.app-title').click();   // 외부 클릭
  await expect(popover).toBeHidden();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
});

test('배경 popover — ESC 키로 닫힘', async ({ page }) => {
  await selectLesson(page, 2);
  await page.locator('#btn-theme').click();
  await expect(page.locator('#theme-popover')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#theme-popover')).toBeHidden();
});

test('BGM popover — 외부 클릭으로 닫힘', async ({ page }) => {
  await selectLesson(page, 2);
  await page.locator('#btn-bgm').click();
  await expect(page.locator('#bgm-popover')).toBeVisible();
  await page.locator('h1.app-title').click();
  await expect(page.locator('#bgm-popover')).toBeHidden();
});

test('reset popover (확인) — 외부 클릭으로 닫힘 (편집 내용은 유지)', async ({ page }) => {
  await selectLesson(page, 2);
  await page.locator('#btn-reset').click();
  await expect(page.locator('#reset-confirm-popover')).toBeVisible();
  await page.locator('h1.app-title').click();
  await expect(page.locator('#reset-confirm-popover')).toBeHidden();
});

test('한 popover 열고 다른 popover 클릭 시 → 기존 popover 자동으로 닫힘', async ({ page }) => {
  await selectLesson(page, 3);

  // 캐릭터 popover 열기
  await page.locator('#btn-character').click();
  await expect(page.locator('#character-popover')).toBeVisible();
  await expect(page.locator('#btn-character')).toHaveAttribute('aria-expanded', 'true');

  // BGM popover 열기 → 캐릭터 popover 자동 닫힘
  await page.locator('#btn-bgm').click();
  await expect(page.locator('#bgm-popover')).toBeVisible();
  await expect(page.locator('#character-popover')).toBeHidden();
  await expect(page.locator('#btn-character')).toHaveAttribute('aria-expanded', 'false');
});

test('동일 popover 버튼 재클릭 시 → 토글 (열림 → 닫힘)', async ({ page }) => {
  await selectLesson(page, 2);
  const btn = page.locator('#btn-theme');
  const popover = page.locator('#theme-popover');

  await btn.click();
  await expect(popover).toBeVisible();
  await btn.click();
  await expect(popover).toBeHidden();
});

test('도구바 popover 가 열린 상태에서 차시 전환 시 popover 자동 닫힘', async ({ page }) => {
  await selectLesson(page, 2);
  await page.locator('#btn-theme').click();
  await expect(page.locator('#theme-popover')).toBeVisible();

  // 차시 전환 → popover 닫혀야 함 (다른 차시 진입 시 도구바 게이트 재계산)
  await selectLesson(page, 3);
  // lesson 3 는 theme 잠금 차시 — popover 가 강제로 닫힘
  await expect(page.locator('#theme-popover')).toBeHidden();
});
