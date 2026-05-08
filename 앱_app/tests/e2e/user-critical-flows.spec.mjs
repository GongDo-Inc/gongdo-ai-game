import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, replaceEditorLine, clickStart, waitForGameIframe, getEditorValue } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
});

test('문서 초기화 — 취소하면 수정 유지, 확인하면 원본 복원', async ({ page }) => {
  await selectLesson(page, 2);
  const original = await getEditorValue(page);

  await replaceEditorLine(page, '- 7칸 : __________ / ____골드', '- 7칸 : 영국 런던: 빅벤 / 6200골드');
  await expect(page.locator('#editor-textarea')).toHaveValue(/영국 런던/);

  await page.locator('#btn-reset').click();
  await expect(page.locator('#reset-confirm-popover')).toBeVisible();
  await page.locator('#btn-reset-no').click();
  await expect(page.locator('#reset-confirm-popover')).toBeHidden();
  await expect(page.locator('#editor-textarea')).toHaveValue(/영국 런던/);

  await page.locator('#btn-reset').click();
  await expect(page.locator('#reset-confirm-popover')).toBeVisible();
  await page.locator('#btn-reset-yes').click();

  await expect(page.locator('#editor-textarea')).toHaveValue(original);
  await expect(page.locator('#game-status')).toContainText('처음 예시로 되돌렸어요');
});

test('3차시 — 도구바 캐릭터 선택으로 문서와 게임 주인공이 함께 바뀜', async ({ page }) => {
  await selectLesson(page, 3);

  await page.locator('#btn-character').click();
  await expect(page.locator('#character-popover')).toBeVisible();
  await page.locator('.character-card[data-char="seulgi"]').click();

  const editorValue = await getEditorValue(page);
  expect(editorValue).toContain('- 주인공: 슬기 (이미지:');
  await expect(page.locator('#start-attention-dot')).toBeVisible();

  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const players = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.players);
  expect(players[0].id).toBe('seulgi');
});

test('2차시 — 도구바 배경 선택으로 문서 프롬프트와 게임 배경이 함께 바뀜', async ({ page }) => {
  await selectLesson(page, 2);

  await page.locator('#btn-theme').click();
  await expect(page.locator('#theme-popover')).toBeVisible();
  await page.locator('.theme-card[data-theme="ocean"]').click();

  const editorValue = await getEditorValue(page);
  expect(editorValue).toContain('- 파도치는 푸른 바닷속');
  await expect(page.locator('#start-attention-dot')).toBeVisible();

  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const board = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.board);
  expect(board.backgroundImageUrl).toMatch(/^data:image\/png;base64,/);
});

test('코드 구경 — 게임 생성 후 문서를 다시 바꾸면 변경 경고가 보임', async ({ page }) => {
  await selectLesson(page, 2);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.locator('#btn-code-view').click();
  await expect(page.locator('#code-view-overlay')).toBeVisible();
  await expect(page.locator('#code-view-warn')).toBeHidden();
  await page.locator('#btn-code-view-close').click();

  await replaceEditorLine(page, '- 1칸 : 대한민국 서울: 경복궁 / 5000골드', '- 1칸 : 대한민국 서울: 경복궁 / 9100골드');

  await page.locator('#btn-code-view').click();
  await expect(page.locator('#code-view-overlay')).toBeVisible();
  await expect(page.locator('#code-view-warn')).toBeVisible();
  await expect(page.locator('#code-view-md')).toContainText('5000골드');
});

test('코드 구경 — 다시 [시작]하면 최신 문서 기준으로 갱신되고 변경 경고가 사라짐', async ({ page }) => {
  await selectLesson(page, 2);
  await clickStart(page);
  await waitForGameIframe(page);

  await replaceEditorLine(page, '- 1칸 : 대한민국 서울: 경복궁 / 5000골드', '- 1칸 : 대한민국 서울: 경복궁 / 9100골드');

  await page.locator('#btn-code-view').click();
  await expect(page.locator('#code-view-warn')).toBeVisible();
  await page.locator('#btn-code-view-close').click();

  await clickStart(page);
  await waitForGameIframe(page);

  await page.locator('#btn-code-view').click();
  await expect(page.locator('#code-view-warn')).toBeHidden();
  await expect(page.locator('#code-view-md')).toContainText('9100골드');
});

test('게임 만들기 — 차시를 열기 전 [시작]을 누르면 생성하지 않고 안내만 보여줌', async ({ page }) => {
  await page.locator('#btn-start').click();

  await expect(page.locator('#game-status')).toContainText('먼저 왼쪽에서 차시를 골라 문서를 열어주세요!');
  await expect(page.locator('#generating-modal')).toBeHidden();
  await expect(page.locator('#game-viewport iframe.game-iframe')).toHaveCount(0);
});

test('발표 자료 — 업로드 API 실패 시 성공처럼 끝나지 않고 실패 안내를 보여줌', async ({ page }) => {
  await page.route('**/api/upload-game', async (route) => {
    await route.fulfill({
      status: 502,
      json: { error: 'storage_error', message: '저장 정보를 기록하지 못했어요. 다시 시도해볼까요?' },
    });
  });

  await selectLesson(page, 4);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.evaluate(() => document.getElementById('btn-present').click());
  await page.locator('#present-title-input').fill('실패 점검용 게임');
  await page.locator('#present-form button[type="submit"]').click();

  const success = page.locator('#present-success');
  await expect(success).toBeVisible({ timeout: 8000 });
  await expect(success).toContainText('게임 업로드 실패');
  await expect(success).toContainText('저장 정보를 기록하지 못했어요');
});

test('발표 자료 — 성공 시 발표 글과 게임 주소를 클립보드에 함께 복사함', async ({ page }) => {
  await page.evaluate(() => {
    window.__copiedTexts = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText(text) {
          window.__copiedTexts.push(text);
          return Promise.resolve();
        },
      },
    });
  });

  await selectLesson(page, 4);
  await clickStart(page);
  await waitForGameIframe(page);

  await page.evaluate(() => document.getElementById('btn-present').click());
  await page.locator('#present-title-input').fill('세계 여행 게임');
  await page.locator('#present-tagline').fill('친구들과 도시를 모으는 모험');
  await page.locator('#present-highlight').fill('런던과 카이로를 넣었어요');
  await page.locator('#present-learned').fill('AI가 게임을 바꾸는 법을 배웠어요');
  await page.locator('#present-form button[type="submit"]').click();

  const success = page.locator('#present-success');
  await expect(success).toBeVisible({ timeout: 8000 });
  await expect(success).toContainText('준비 완료!');

  const copied = await page.evaluate(() => window.__copiedTexts);
  expect(copied).toHaveLength(1);
  expect(copied[0]).toContain('세계 여행 게임');
  expect(copied[0]).toContain('http://localhost/api/play?id=mock-id');
  expect(copied[0]).toContain('런던과 카이로를 넣었어요');
});
