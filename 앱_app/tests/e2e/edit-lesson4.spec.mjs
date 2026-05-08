/**
 * 4차시 — 발표 자료 등록 흐름.
 * lesson 4 는 게임 자체보다 발표 모달(present-modal) 채우고 /api/upload-game 호출하는 게 핵심.
 *
 * 흐름:
 *   1. lesson 4 선택 → 에디터에 lesson4.md 본문
 *   2. [▶ 시작] → 게임 iframe 생성 (lastGeneratedHtml 저장)
 *   3. 발표자료 모달 열기 (#btn-present.click() — UI 진입점은 hidden 이라 직접 호출)
 *   4. 폼 채우고 제출
 *   5. /api/upload-game 호출 검증 (mock 으로 캡처) + 성공 메시지
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe, getEditorValue, getUploadCalls } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
});

test('lesson 4 선택 → 에디터에 lesson4.md 본문 + 발표 안내', async ({ page }) => {
  await selectLesson(page, 4);
  const v = await getEditorValue(page);
  expect(v).toContain('# 4차시');
  expect(v).toContain('발표');
});

test('발표 자료 등록 — 게임 만들고 폼 채우고 제출 → /api/upload-game 호출', async ({ page }) => {
  await selectLesson(page, 4);
  await clickStart(page);
  await waitForGameIframe(page);

  // 발표자료 모달 열기 (헤더 버튼은 hidden 이라 직접 click 호출)
  await page.evaluate(() => document.getElementById('btn-present').click());
  const modal = page.locator('#present-modal');
  await expect(modal).toBeVisible();

  // 폼 필드 채우기
  await page.locator('#present-title-input').fill('내 부루마블 게임');
  await page.locator('#present-tagline').fill('친구들과 함께하는 세계여행 부루마블!');
  await page.locator('#present-highlight').fill('도시를 매입하는 게 가장 재미있었어요');
  await page.locator('#present-learned').fill('AI 가 이미지를 만드는 법을 배웠어요');

  // 제출
  await page.locator('#present-form button[type="submit"]').click();

  // 성공 패널 표시
  const success = page.locator('#present-success');
  await expect(success).toBeVisible({ timeout: 8000 });

  // /api/upload-game 호출 검증
  const calls = getUploadCalls(page);
  expect(calls.length).toBeGreaterThanOrEqual(1);
  const last = calls[calls.length - 1];
  expect(last.title).toBe('내 부루마블 게임');
  expect(last.tagline).toContain('세계여행');
  expect(last.lessonNo).toBe(4);
  // html 페이로드 — 마블 게임 HTML 이 들어가야 함 (length > 0)
  expect(typeof last.html).toBe('string');
  expect(last.html.length).toBeGreaterThan(100);
});

test('발표 자료 — 게임 미생성 상태에서 제출 시 업로드 실패 처리', async ({ page }) => {
  await selectLesson(page, 4);
  // [시작] 누르지 않은 상태 — state.lastGeneratedHtml 없음

  await page.evaluate(() => document.getElementById('btn-present').click());
  await expect(page.locator('#present-modal')).toBeVisible();

  await page.locator('#present-title-input').fill('테스트 게임');
  await page.locator('#present-form button[type="submit"]').click();

  // 성공 패널은 뜨지만 — uploadError 메시지 표시 + uploadCalls 없음
  const success = page.locator('#present-success');
  await expect(success).toBeVisible({ timeout: 5000 });
  const calls = getUploadCalls(page);
  expect(calls.length).toBe(0);
  // 실패 안내가 success-list 어딘가에 있어야 함
  await expect(success).toContainText(/실패|올리지 못|먼저/);
});

test('발표 모달 — 닫기 버튼으로 닫힘', async ({ page }) => {
  await selectLesson(page, 4);
  await page.evaluate(() => document.getElementById('btn-present').click());
  await expect(page.locator('#present-modal')).toBeVisible();
  await page.locator('#present-close').click();
  await expect(page.locator('#present-modal')).toBeHidden();
});

test('발표 모달 — 클립보드 복사 안내 + 패들렛 링크 버튼', async ({ page }) => {
  await selectLesson(page, 4);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.evaluate(() => document.getElementById('btn-present').click());
  await page.locator('#present-title-input').fill('내 게임');
  await page.locator('#present-form button[type="submit"]').click();

  const success = page.locator('#present-success');
  await expect(success).toBeVisible({ timeout: 8000 });

  // 패들렛 링크 버튼 노출
  const padletBtn = page.locator('#present-open-padlet');
  await expect(padletBtn).toBeVisible();
});
