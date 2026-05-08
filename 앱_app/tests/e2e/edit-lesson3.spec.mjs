/**
 * 3차시 — 주인공 선택, 도시 가격·이름, 시작머니 30,000, 40칸 보드, 보드 회전 검증.
 * lesson 3 는 lesson 1·2 와 다른 정책 (worldmap 고정, simpleBoard=false 등) — 별도 검증.
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, replaceEditorLine, clickStart, waitForGameIframe, getEditorValue } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
  await selectLesson(page, 3);
});

test('주인공을 슬기로 변경 → CONFIG.players[0].id=seulgi', async ({ page }) => {
  await replaceEditorLine(page, '- 주인공: 데니스', '- 주인공: 슬기');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const players = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.players);
  expect(players[0].id).toBe('seulgi');
  // 상대는 자동으로 반대편 (데니스)
  expect(players[1].id).toBe('dennis');
});

test('주인공이 데니스 (기본) → 상대는 자동 슬기', async ({ page }) => {
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const players = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.players);
  expect(players[0].id).toBe('dennis');
  expect(players[1].id).toBe('seulgi');
});

test('도시 가격 변경 → CONFIG.cities 반영', async ({ page }) => {
  await replaceEditorLine(page, '- 1칸 : 대한민국 서울: 경복궁 / 5000골드', '- 1칸 : 대한민국 서울: 경복궁 / 9999골드');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const seoul = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.cities.find((c) => c.index === 1));
  expect(seoul.toll).toBe(9999);
});

test('40칸 보드 + 시작머니 30,000 + boardRotation 180 + cityBuyChoice', async ({ page }) => {
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.board.cellCount).toBe(40);
  expect(config.rules.startGold).toBe(30000);
  expect(config.ui.boardRotation).toBe(180);
  expect(config.ui.cityBuyChoice).toBe(true);
});

test('worldmap 배경 fallback (lessonTheme=default → fallback 적용)', async ({ page }) => {
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const board = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.board);
  // app.js 가 lesson 3 에 origin-relative URL 주입, 또는 template fallback 적용
  expect(board.backgroundImageUrl).toMatch(/worldmap\.(jpg|png)/);
});

test('주사위 변경 → AI 이미지 생성', async ({ page }) => {
  await replaceEditorLine(page, '- 기본 주사위', '- 강아지 주사위');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const dice = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.dice);
  expect(dice.imageUrl).toMatch(/^data:image\/png;base64,/);
});

test('lesson 3 → 4 전환 시 인계 차단 (lesson 4 base 그대로)', async ({ page }) => {
  // lesson 3 에서 도시 가격 변경
  await replaceEditorLine(page, '- 1칸 : 대한민국 서울: 경복궁 / 5000골드', '- 1칸 : 대한민국 서울: 경복궁 / 99999골드');
  await selectLesson(page, 4);
  const v = await getEditorValue(page);
  // lesson 4 는 발표용 — 도시 목록 없음, 인계 안 됨
  expect(v).toContain('# 4차시');
  expect(v).not.toContain('99999골드');
});
