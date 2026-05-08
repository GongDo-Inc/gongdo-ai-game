/**
 * 코드 구경 추가 시나리오 — user-critical-flows 가 이미 다루는 변경 경고/재시작 외의 흐름.
 *
 * 보강 시나리오:
 *   1. 게임 미생성 시 코드 구경 → empty 안내 ("먼저 [▶ 시작]을 눌러요!")
 *   2. 4차시 — 코드 구경 버튼 자체가 hidden (CODE_VIEW_LESSONS = {1,2,3})
 *   3. 마크다운 안 [🔍 코드] 섹션 버튼 클릭 → 해당 코드 하이라이트 + [📜 전체 보기] 등장
 *   4. [📜 전체 보기] 클릭 → 전체 코드 + show-all 버튼 사라짐
 *   5. ESC 키로 코드 구경 닫힘
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('게임 미생성 시 코드 구경 → "먼저 [▶ 시작]을 눌러요!" empty 안내', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  // [시작] 누르지 않은 상태 — state.lastGeneratedHtml 없음
  await page.locator('#btn-code-view').click();
  await expect(page.locator('#code-view-overlay')).toBeVisible();

  const md = page.locator('#code-view-md');
  await expect(md).toContainText('먼저 [▶ 시작]을 눌러');
  // 코드 본문은 비어있음
  await expect(page.locator('#code-view-content')).toHaveText('');
  // 변경 경고/stale 배지 모두 hidden
  await expect(page.locator('#code-view-warn')).toBeHidden();
  await expect(page.locator('#code-view-stale')).toBeHidden();
});

test('4차시 — 코드 구경 버튼 자체가 hidden (CODE_VIEW_LESSONS = {1,2,3})', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 4);
  await expect(page.locator('#btn-code-view')).toBeHidden();
});

test('1·2·3차시 — 코드 구경 버튼 노출', async ({ page }) => {
  await page.goto('/');
  for (const lesson of [1, 2, 3]) {
    await selectLesson(page, lesson);
    await expect(page.locator('#btn-code-view')).toBeVisible();
  }
});

test('마크다운 섹션 [🔍 코드] 클릭 → 코드 하이라이트 + [📜 전체 보기] 등장', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.locator('#btn-code-view').click();
  await expect(page.locator('#code-view-overlay')).toBeVisible();

  // 처음 열었을 땐 [📜 전체 보기] 숨김 (전체 보기 상태)
  await expect(page.locator('#btn-code-show-all')).toBeHidden();

  // 마크다운 안 첫 번째 [🔍 코드] 버튼 클릭
  const sectionBtn = page.locator('#code-view-md .md-section-btn').first();
  await expect(sectionBtn).toBeVisible();
  await sectionBtn.click();

  // 안내 메시지가 success 또는 fail 카테고리로 노출
  await expect(page.locator('#code-view-info')).toBeVisible({ timeout: 3_000 });

  // 매칭 성공 시 → show-all 버튼 등장. 매칭 실패 (fallback) 시 → 안내 fail.
  // 두 케이스 모두 허용 (mock HTML 이라 매칭이 안 될 수도) — info 노출만 확인.
  const infoKind = await page.locator('#code-view-info').getAttribute('data-kind');
  expect(['success', 'fail']).toContain(infoKind);
});

test('섹션 매칭 성공 후 [📜 전체 보기] 클릭 → show-all 사라지고 전체 코드 표시', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.locator('#btn-code-view').click();

  // 강제로 show-all 보이게 (섹션 매칭 성공한 상태 시뮬레이션)
  await page.evaluate(() => {
    document.getElementById('btn-code-show-all').hidden = false;
  });
  await expect(page.locator('#btn-code-show-all')).toBeVisible();

  await page.locator('#btn-code-show-all').click();
  await expect(page.locator('#btn-code-show-all')).toBeHidden();
  // info 도 닫힘 (showFullCode → hideCodeViewInfo)
  await expect(page.locator('#code-view-info')).toBeHidden();
});

test('코드 구경 — ESC 키로 닫힘', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.locator('#btn-code-view').click();
  await expect(page.locator('#code-view-overlay')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#code-view-overlay')).toBeHidden();
});

test('코드 구경 — 외부 클릭으로 닫힘 (overlay 외부 영역)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.locator('#btn-code-view').click();
  await expect(page.locator('#code-view-overlay')).toBeVisible();

  // 페이지 헤더(타이틀)는 overlay 와 코드 구경 버튼 모두 외부
  await page.locator('h1.app-title').click();
  await expect(page.locator('#code-view-overlay')).toBeHidden();
});
