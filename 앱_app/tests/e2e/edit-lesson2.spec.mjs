/**
 * 2차시 — 도시 규칙·음악·핀·주사위·보드 색상 모두 수정해보고 게임 반영 검증.
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, replaceEditorLine, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
  await selectLesson(page, 2);
});

test('도시 가격 변경 → CONFIG.cities[].toll 반영', async ({ page }) => {
  await replaceEditorLine(page, '- 1칸 : 대한민국 서울: 경복궁 / 5000골드', '- 1칸 : 대한민국 서울: 경복궁 / 12000골드');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const seoul = await frame.evaluate(() => {
    return window.__GONGDO_MARBLE_CONFIG__.cities.find((c) => c.index === 1);
  });
  expect(seoul.toll).toBe(12000);
});

test('도시 이름 변경 → CONFIG.cities[].label 반영', async ({ page }) => {
  await replaceEditorLine(page, '- 1칸 : 대한민국 서울: 경복궁 / 5000골드', '- 1칸 : 대한민국 부산: 광안대교 / 5000골드');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const cell = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.cities.find((c) => c.index === 1));
  expect(cell.label).toBe('대한민국 부산');
  expect(cell.landmark).toBe('광안대교');
});

test('빈칸(7칸) 새 도시 추가 — 단일 라벨 형식 매칭', async ({ page }) => {
  await replaceEditorLine(page, '- 7칸 : __________ / ____골드', '- 7칸 : 유나네 집 / 8000골드');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const c7 = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.cities.find((c) => c.index === 7));
  expect(c7).toBeTruthy();
  expect(c7.label).toBe('유나네 집');
  expect(c7.toll).toBe(8000);
});

test('### 음악 프롬프트 변경 → /api/music 호출 + appliedToGame 설정', async ({ page }) => {
  await replaceEditorLine(page, '- 기본 음악', '- 신나는 우주 전투');
  await clickStart(page);
  await waitForGameIframe(page);
  const score = await page.evaluate(() => window.GongdoBGM?.getAppliedScore?.());
  expect(score).toBeTruthy();
  expect(typeof score.tempo).toBe('number');
});

test('핀 + 주사위 + 보드 색상 동시 변경 — 모두 반영', async ({ page }) => {
  await replaceEditorLine(page, '- **나** : 빨간 핀', '- **나** : 핑크 핀');
  await replaceEditorLine(page, '- 기본 주사위', '- 별 주사위');
  await replaceEditorLine(page, '- 기본 보드', '- 노을 하늘처럼');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.players[0].pinColor).toBe('#F48FA0');
  expect(config.dice.theme).toBe('star');
  expect(config.board.backgroundImageUrl).toMatch(/^data:image\/png;base64,/);
});
