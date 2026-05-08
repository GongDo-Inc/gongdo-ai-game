/**
 * BGM 적용 취소 (#bgm-applied-clear) — 학생이 음악을 적용했다가 취소하는 흐름.
 *
 * 흐름:
 *   1. 음악 popover 에서 AI 음악 생성 → 자동 적용 → applied-badge 노출
 *   2. badge 안 [✕] 버튼 클릭 → state.appliedToGame=null → badge 숨김
 *   3. 도구바 라벨이 "음악 정지/실행" → "음악" 으로 복귀 (적용 해제)
 *   4. 시작 영역 미니 배지 (#start-music-badge) 도 hidden
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('lesson 2 — 음악 적용 후 [✕] 클릭 → applied-badge 숨김 + state.appliedToGame=null', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // 1. AI 음악 생성 → 자동 적용
  await page.locator('#btn-bgm').click();
  await page.locator('#bgm-ai-input').fill('차분한 클래식');
  await page.locator('#btn-bgm-generate').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.state?.appliedToGame);
  }, { timeout: 5_000 }).toBe(true);

  // applied-badge 노출
  await expect(page.locator('#bgm-applied-badge')).toBeVisible();

  // 2. [✕] 클릭으로 취소
  await page.locator('#bgm-applied-clear').click();

  // 3. state.appliedToGame=null + badge 숨김
  await expect.poll(async () => {
    return page.evaluate(() => window.GongdoBGM?.state?.appliedToGame);
  }).toBeNull();
  await expect(page.locator('#bgm-applied-badge')).toBeHidden();
});

test('lesson 2 — 적용 + [✕] 한 후 [▶ 시작] → 게임 HTML 에 BGM 미주입 (취소 효과 검증)', async ({ page }) => {
  // 적용 후 취소 → 게임 생성 시 음악이 HTML 에 주입되지 않아야 한다.
  // (이전: 적용 상태였으면 HTML 에 BGM 스크립트가 들어가 발표 업로드 시 함께 저장됨)
  await page.goto('/');
  await selectLesson(page, 2);

  await page.locator('#btn-bgm').click();
  await page.locator('#bgm-ai-input').fill('취소 효과 검증');
  await page.locator('#btn-bgm-generate').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.state?.appliedToGame);
  }, { timeout: 5_000 }).toBe(true);

  await page.locator('#bgm-applied-clear').click();
  await expect.poll(async () => {
    return page.evaluate(() => window.GongdoBGM?.state?.appliedToGame);
  }).toBeNull();

  // 취소 직후 lastGeneratedHtml(아직 없음) — getAppliedScore 가 null 반환해야
  const score = await page.evaluate(() => window.GongdoBGM?.getAppliedScore?.());
  expect(score).toBeNull();
});

test('lesson 2 — 적용 취소 후 새로 생성하면 다시 적용됨 (취소가 영구 차단이 아님)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // 1차 생성·적용·취소
  await page.locator('#btn-bgm').click();
  await page.locator('#bgm-ai-input').fill('첫 번째 음악');
  await page.locator('#btn-bgm-generate').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.state?.appliedToGame);
  }).toBe(true);
  await page.locator('#bgm-applied-clear').click();
  await expect(page.locator('#bgm-applied-badge')).toBeHidden();

  // 2차 생성·자동 적용 (popover 가 그대로 열려있음 — 다시 입력 후 생성)
  await page.locator('#bgm-ai-input').fill('두 번째 음악');
  await page.locator('#btn-bgm-generate').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.state?.appliedToGame);
  }, { timeout: 5_000 }).toBe(true);
  await expect(page.locator('#bgm-applied-badge')).toBeVisible();
});
