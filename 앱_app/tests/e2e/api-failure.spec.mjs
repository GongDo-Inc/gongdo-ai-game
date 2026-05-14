/**
 * AI/네트워크 실패 시나리오 — 학생이 가장 많이 부딪히는 실패 케이스.
 *
 * 주의: lesson 1~4 의 [▶ 시작]은 로컬 buildPatchedMarbleHtml 템플릿 경로를 쓰고
 *   /api/chat 'generator' 모드를 호출하지 않는다 (app.js:1181-1238).
 *   따라서 generator-mode 429/cooldown 흐름은 현재 빌드에서 도달 불가 — 테스트 X.
 *
 * 실제 실패가 사용자에게 노출되는 경로:
 *   1. /api/chat 'tutor' 429 → 봇 메시지 "AI 튜터가 잠깐..."
 *   2. /api/chat 'tutor' 500 → 봇 메시지 (data.message 노출)
 *   3. /api/chat 'tutor' 네트워크 예외 → "AI 튜터가 잠깐 쉬고 있어요"
 *   4. /api/lesson-background 502 → backgroundImageUrl 없음, 게임은 정상 생성
 *   5. /api/upload-game 502 → present-success 패널에 실패 안내 (user-critical-flows 에 이미 있음)
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, askTutor, replaceEditorLine, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

// ─────────── 튜터 실패 응답 ───────────

test('튜터 — /api/chat 429 (rate limited) → 봇 메시지로 안내, 펜딩 메시지 사라짐', async ({ page }) => {
  // setupMocks 의 핸들러를 unroute 후 새로 등록 (Playwright 1.59 에서 동일 URL route 중복은 동작 일관성이 낮음)
  await page.unroute('**/api/chat');
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'rate_limited', resetInSec: 30, message: 'AI 튜터가 잠깐 쉬고 있어요 (rate limit)' }),
    });
  });

  await page.goto('/');
  await selectLesson(page, 2);
  await askTutor(page, '도시 추천해줘');

  // 펜딩 '...' 메시지가 정상 봇 메시지로 교체됨
  const lastBotMsg = page.locator('.tutor-message.tutor-message-bot').last();
  await expect(lastBotMsg).not.toHaveAttribute('data-pending', /.*/);
  await expect(lastBotMsg).toContainText(/AI 튜터|쉬고/);
});

test('튜터 — /api/chat 500 서버 에러 → data.message 가 봇 메시지로 노출', async ({ page }) => {
  await page.unroute('**/api/chat');
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'internal_error', message: '잠깐 문제가 생겼어요' }),
    });
  });

  await page.goto('/');
  await selectLesson(page, 2);
  await askTutor(page, '뭐 추천해줘');

  const lastBotMsg = page.locator('.tutor-message.tutor-message-bot').last();
  await expect(lastBotMsg).not.toHaveAttribute('data-pending', /.*/);
  await expect(lastBotMsg).toContainText('잠깐 문제가 생겼어요');
});

test('튜터 — /api/chat 네트워크 예외 (route abort) → "AI 튜터가 잠깐 쉬고 있어요" 안내', async ({ page }) => {
  await page.unroute('**/api/chat');
  await page.route('**/api/chat', (route) => route.abort('failed'));

  await page.goto('/');
  await selectLesson(page, 2);

  // askTutor 헬퍼는 응답이 도착할 때까지 기다리는데 abort 시에도 catch 블록에서 메시지가 추가됨
  const fab = page.locator('#tutor-fab');
  if (await fab.isVisible()) {
    const drawerOpen = await page.locator('#tutor-drawer.is-open').isVisible().catch(() => false);
    if (!drawerOpen) await fab.click();
  }
  await page.locator('#tutor-input').fill('아무거나 물어볼게');
  const before = await page.locator('.tutor-message.tutor-message-bot').count();
  await page.locator('#tutor-form button[type="submit"]').click();

  await page.waitForFunction(
    (prev) => {
      const all = document.querySelectorAll('.tutor-message.tutor-message-bot');
      if (all.length <= prev) return false;
      const last = all[all.length - 1];
      return !last.dataset.pending;
    },
    before,
    { timeout: 5_000 }
  );

  const lastBotMsg = page.locator('.tutor-message.tutor-message-bot').last();
  await expect(lastBotMsg).toContainText('AI 튜터가 잠깐 쉬고 있어요');
});

// ─────────── 배경 이미지 실패 ───────────

test('/api/lesson-background 502 → backgroundImageUrl 빈 문자열, 게임 자체는 정상 생성', async ({ page }) => {
  await page.unroute('**/api/lesson-background');
  await page.route('**/api/lesson-background', async (route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'image_gen_failed', message: '이미지 생성 실패' }),
    });
  });

  await page.goto('/');
  await selectLesson(page, 1);
  // 비-기본 보드 색상 → useAiBackgroundImage 트리거
  await replaceEditorLine(page, '- 기본 보드', '- 노을 하늘처럼');
  await clickStart(page);

  // iframe 이 정상 attached + CONFIG 주입까지 (waitForGameIframe 헬퍼)
  const frame = await waitForGameIframe(page);
  const board = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.board);
  expect(board).toBeTruthy();
  // 배경 이미지 생성 실패 → backgroundImageUrl 비어있음 (lesson 1 worksheet 모드)
  expect(board.backgroundImageUrl).toBe('');
});

test('/api/lesson-background 502 (3차시) → worldmap fallback 으로 채워짐 (lessonTheme=default)', async ({ page }) => {
  await page.unroute('**/api/lesson-background');
  await page.route('**/api/lesson-background', async (route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'image_gen_failed' }),
    });
  });

  await page.goto('/');
  await selectLesson(page, 3);
  await clickStart(page);

  // lesson 3 는 lessonTheme=default → 배경 생성 실패해도 worldmap 정적 이미지로 fallback
  const frame = await waitForGameIframe(page);
  const board = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.board);
  expect(board.backgroundImageUrl).toMatch(/worldmap\.(jpg|png)/);
});
