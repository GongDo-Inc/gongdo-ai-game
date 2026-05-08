/**
 * 1차시 — 바이브코딩 문서 수정 → 게임 CONFIG 반영 확인.
 * 학생이 가장 많이 만지는 영역: 핀 색상, 주사위, 보드 색상.
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, replaceEditorLine, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
  await selectLesson(page, 1);
});

test('핀 색상 변경 (매핑된 색) → CONFIG.players[i].pinColor 반영', async ({ page }) => {
  await replaceEditorLine(page, '- **나** : 빨간 핀', '- **나** : 핑크 핀');
  await replaceEditorLine(page, '- **친구**: 파란 핀', '- **친구**: 노란 핀');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const players = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.players);
  expect(players[0].pinColor).toBe('#F48FA0'); // 핑크
  expect(players[1].pinColor).toBe('#F7C548'); // 노란
});

test('핀 색상 (미매핑) → Claude mock 결과로 폴백', async ({ page }) => {
  // 라벤더 = SIMPLE_COLOR_MAP 미매핑 → colorMatched=false → Claude 결과 우선
  await replaceEditorLine(page, '- **나** : 빨간 핀', '- **나** : 라벤더 핀');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const players = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.players);
  // Claude mock 응답: [{color:'#FF5577'}, {color:'#55AAFF'}]
  expect(players[0].pinColor).toBe('#FF5577');
});

test('주사위 키워드 변경 (별) → theme=star', async ({ page }) => {
  await replaceEditorLine(page, '- 기본 주사위', '- 별 주사위');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const dice = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.dice);
  expect(dice.theme).toBe('star');
  expect(dice.label).toContain('별');
});

test('주사위 비-키워드 (강아지) → Claude mock + AI 이미지 생성', async ({ page }) => {
  await replaceEditorLine(page, '- 기본 주사위', '- 강아지 주사위');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const dice = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.dice);
  // Claude mock 응답: { label: 'mock 주사위', emoji: '🐕', theme: 'classic' }
  expect(dice.label).toBe('mock 주사위');
  expect(dice.emoji).toBe('🐕');
  // dice 이미지도 생성 (mock 1×1 PNG)
  expect(dice.imageUrl).toMatch(/^data:image\/png;base64,/);
});

test('보드 색상 묘사 → 이미지 생성 호출 + backgroundImageUrl 설정', async ({ page }) => {
  await replaceEditorLine(page, '- 기본 보드', '- 노을 하늘처럼');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const board = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.board);
  expect(board.backgroundImageUrl).toMatch(/^data:image\/png;base64,/);
});

test('보드 색상 = "기본 보드" → 이미지 생성 안 함', async ({ page }) => {
  // 기본값 그대로 → useAiBackgroundImage 는 발사되지만 prompt 없어 skip
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const board = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.board);
  // backgroundImageUrl 빈 문자열 (lesson 1·2 worksheet 모드라 worldmap fallback X)
  expect(board.backgroundImageUrl).toBe('');
});
