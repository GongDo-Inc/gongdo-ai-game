/**
 * 3차시 — 빨간/파란 핀 기본 시작, 캐릭터 전환, 도시 가격, 시작 금액(per-player), 40칸 보드, 보드 회전 검증.
 * lesson 3 는 lesson 1·2 와 다른 정책 (worldmap 고정, simpleBoard=false 등) — 별도 검증.
 *
 * v1.4.0 (2026-05-11) 시점 포맷:
 *   - ### 플레이어 핀 (기본 빨간 핀/파란 핀, 학생이 데니스/슬기 입력 시 캐릭터 전환)
 *   - ### 시작 금액 (주인공·AI친구 별도)
 *   - 황금카드 6칸 모두 🔑 (화투패 🎴 제거)
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, replaceEditorLine, clickStart, waitForGameIframe, getEditorValue } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
  await selectLesson(page, 3);
});

test('기본 진입 → 빨간 핀(주인공) + 파란 핀(AI친구)', async ({ page }) => {
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.players[0].name).toBe('주인공');
  expect(config.players[1].name).toBe('AI친구');
  // 핀 모드 → pinColor 채워지고 imageUrl 비어있음
  expect(config.players[0].pinColor).toBeTruthy();
  expect(config.players[1].pinColor).toBeTruthy();
  expect(config.players[0].imageUrl).toBeFalsy();
  expect(config.players[1].imageUrl).toBeFalsy();
  expect(config.ui.usePinTokens).toBe(true);
});

test('주인공을 데니스, AI친구를 슬기로 변경 → 캐릭터 모드 전환 + usePinTokens=false', async ({ page }) => {
  await replaceEditorLine(page, '- **주인공** : 빨간 핀', '- **주인공** : 데니스');
  await replaceEditorLine(page, '- **AI친구** : 파란 핀', '- **AI친구** : 슬기');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.players[0].id).toBe('dennis');
  expect(config.players[0].name).toBe('데니스');
  expect(config.players[0].imageUrl).toMatch(/dennis\.png/);
  expect(config.players[1].id).toBe('seulgi');
  expect(config.players[1].name).toBe('슬기');
  expect(config.players[1].imageUrl).toMatch(/seulgi\.png/);
  expect(config.ui.usePinTokens).toBe(false);
});

test('도시 가격 변경 → CONFIG.cities 반영', async ({ page }) => {
  await replaceEditorLine(page, '- 1칸 : 대한민국 서울: 경복궁 / 5000골드', '- 1칸 : 대한민국 서울: 경복궁 / 9999골드');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const seoul = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__.cities.find((c) => c.index === 1));
  expect(seoul.toll).toBe(9999);
});

test('40칸 보드 + 시작머니 30,000 (기본) + boardRotation 180 + cityBuyChoice', async ({ page }) => {
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

// ─────────── 신규 검증 (2026-05-11 요청) ───────────

test('[시작] 클릭 → 기본 진입은 핀 토큰이 DOM 에 보임 (.pin-token + .pin-inner "1"/"2")', async ({ page }) => {
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  await frame.waitForFunction(() => document.querySelectorAll('.token').length >= 2, null, { timeout: 10_000 });
  const tokens = await frame.evaluate(() => {
    return Array.from(document.querySelectorAll('.token')).map((el) => ({
      isPinToken: el.classList.contains('pin-token'),
      pinColor: el.style.getPropertyValue('--pin-color'),
      hasBackgroundImage: !!el.style.backgroundImage && el.style.backgroundImage !== 'none',
      pinNumber: el.querySelector('.pin-inner')?.textContent || '',
      name: el.querySelector('.token-name')?.textContent || '',
    }));
  });
  expect(tokens).toHaveLength(2);
  // 두 플레이어 모두 핀 모드
  expect(tokens[0].isPinToken).toBe(true);
  expect(tokens[1].isPinToken).toBe(true);
  expect(tokens[0].pinNumber).toBe('1');
  expect(tokens[1].pinNumber).toBe('2');
  // 핀 모드에서는 캐릭터 background-image 가 없어야 함
  expect(tokens[0].hasBackgroundImage).toBe(false);
  expect(tokens[1].hasBackgroundImage).toBe(false);
  // 색상 채워졌는지 (빨강/파랑 hex)
  expect(tokens[0].pinColor).toBeTruthy();
  expect(tokens[1].pinColor).toBeTruthy();
});

test('[시작] 클릭 → 데니스/슬기 입력 시 캐릭터 토큰 (.pin-token 없음 + background-image 채워짐)', async ({ page }) => {
  await replaceEditorLine(page, '- **주인공** : 빨간 핀', '- **주인공** : 데니스');
  await replaceEditorLine(page, '- **AI친구** : 파란 핀', '- **AI친구** : 슬기');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  await frame.waitForFunction(() => document.querySelectorAll('.token').length >= 2, null, { timeout: 10_000 });
  const tokens = await frame.evaluate(() => {
    return Array.from(document.querySelectorAll('.token')).map((el) => ({
      isPinToken: el.classList.contains('pin-token'),
      hasBackgroundImage: !!el.style.backgroundImage && el.style.backgroundImage !== 'none',
      backgroundImage: el.style.backgroundImage,
      hasPinInner: !!el.querySelector('.pin-inner'),
      name: el.querySelector('.token-name')?.textContent || '',
    }));
  });
  expect(tokens).toHaveLength(2);
  // 캐릭터 모드 → 핀 클래스 없음
  expect(tokens[0].isPinToken).toBe(false);
  expect(tokens[1].isPinToken).toBe(false);
  // 캐릭터 이미지 url 채워짐
  expect(tokens[0].hasBackgroundImage).toBe(true);
  expect(tokens[1].hasBackgroundImage).toBe(true);
  expect(tokens[0].backgroundImage).toMatch(/dennis\.png/);
  expect(tokens[1].backgroundImage).toMatch(/seulgi\.png/);
  // 캐릭터 모드에서는 pin-inner ('1'/'2') 가 없어야
  expect(tokens[0].hasPinInner).toBe(false);
  expect(tokens[1].hasPinInner).toBe(false);
  // 이름표는 캐릭터 이름
  expect(tokens[0].name).toBe('데니스');
  expect(tokens[1].name).toBe('슬기');
});

test('혼합 모드 (주인공=데니스 / AI친구=파란 핀) → 1번 토큰만 캐릭터, 2번은 핀으로 렌더', async ({ page }) => {
  // 학생이 한 줄만 캐릭터로 바꾼 경우 — 토큰이 per-player 로 정확히 렌더되는지
  await replaceEditorLine(page, '- **주인공** : 빨간 핀', '- **주인공** : 데니스');
  // AI친구는 그대로 "파란 핀"
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  await frame.waitForFunction(() => document.querySelectorAll('.token').length >= 2, null, { timeout: 10_000 });
  const tokens = await frame.evaluate(() => {
    return Array.from(document.querySelectorAll('.token')).map((el) => ({
      isPinToken: el.classList.contains('pin-token'),
      hasBackgroundImage: !!el.style.backgroundImage && el.style.backgroundImage !== 'none',
      backgroundImage: el.style.backgroundImage,
      hasPinInner: !!el.querySelector('.pin-inner'),
      name: el.querySelector('.token-name')?.textContent || '',
    }));
  });
  expect(tokens).toHaveLength(2);
  // player 0 — 캐릭터 (데니스 이미지)
  expect(tokens[0].isPinToken).toBe(false);
  expect(tokens[0].hasBackgroundImage).toBe(true);
  expect(tokens[0].backgroundImage).toMatch(/dennis\.png/);
  expect(tokens[0].name).toBe('데니스');
  // player 1 — 핀 (파란 핀)
  expect(tokens[1].isPinToken).toBe(true);
  expect(tokens[1].hasBackgroundImage).toBe(false);
  expect(tokens[1].hasPinInner).toBe(true);
  expect(tokens[1].name).toBe('AI친구');
});

test('도구바 캐릭터 버튼(슬기) → 주인공·AI친구 모두 동기화 (혼합 모드 회피)', async ({ page }) => {
  // 도구바에서 슬기 선택 시 주인공=슬기, AI친구=데니스 로 자동 동기화 — pin 잔존 없음
  await page.locator('#btn-character').click();
  await page.locator('.character-card[data-char="seulgi"]').click();
  const editorValue = await page.evaluate(() => document.getElementById('editor-textarea').value);
  expect(editorValue).toContain('- **주인공** : 슬기');
  expect(editorValue).toContain('- **AI친구** : 데니스');
  // 데이터 라인에는 핀 텍스트가 남아있지 않아야 함 (안내 인용문은 OK)
  expect(editorValue).not.toMatch(/^-\s*\*\*(?:주인공|AI친구)\*\*\s*:\s*[빨파]란 핀/m);

  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.players[0].id).toBe('seulgi');
  expect(config.players[1].id).toBe('dennis');
});

test('주인공 50,000 / AI친구 10,000 → CONFIG + 게임 state + HUD 모두 정확히 반영', async ({ page }) => {
  await replaceEditorLine(page, '- 주인공 : 30,000골드', '- 주인공 : 50,000골드');
  await replaceEditorLine(page, '- AI친구 : 30,000골드', '- AI친구 : 10,000골드');
  await clickStart(page);
  const frame = await waitForGameIframe(page);

  // 1) CONFIG 단계: per-player startGold 가 주입됐는지
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.players[0].startGold).toBe(50000);
  expect(config.players[1].startGold).toBe(10000);
  // 글로벌 startGold 는 주인공 값으로 (parseLesson3StartGold 사양)
  expect(config.rules.startGold).toBe(50000);

  // 2) 게임 state: 각 플레이어의 초기 gold 가 다른 값으로 세팅
  await frame.waitForFunction(() => document.getElementById('gold-p0')?.textContent, null, { timeout: 10_000 });
  const hudGolds = await frame.evaluate(() => ({
    p0: document.getElementById('gold-p0')?.textContent || '',
    p1: document.getElementById('gold-p1')?.textContent || '',
    p0Label: document.getElementById('label-p0')?.textContent || '',
    p1Label: document.getElementById('label-p1')?.textContent || '',
  }));

  // 3) HUD 화면 표시: toLocaleString() 으로 콤마 포함
  expect(hudGolds.p0).toContain('50,000');
  expect(hudGolds.p1).toContain('10,000');
  // 주인공 라벨에 (나) 표시, AI친구는 없음
  expect(hudGolds.p0Label).toContain('(나)');
  expect(hudGolds.p1Label).not.toContain('(나)');
});

test('주인공만 시작 금액 변경 → 그 값이 글로벌 startGold + AI친구는 글로벌 fallback', async ({ page }) => {
  // AI친구 줄은 그대로 두고 주인공만 100,000 으로
  await replaceEditorLine(page, '- 주인공 : 30,000골드', '- 주인공 : 100,000골드');
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const config = await frame.evaluate(() => window.__GONGDO_MARBLE_CONFIG__);
  expect(config.rules.startGold).toBe(100000);
  expect(config.players[0].startGold).toBe(100000);
  // AI친구 줄도 30,000 그대로 적혀있으므로 30,000 으로 파싱됨
  expect(config.players[1].startGold).toBe(30000);

  await frame.waitForFunction(() => document.getElementById('gold-p0')?.textContent, null, { timeout: 10_000 });
  const hud = await frame.evaluate(() => ({
    p0: document.getElementById('gold-p0')?.textContent || '',
    p1: document.getElementById('gold-p1')?.textContent || '',
  }));
  expect(hud.p0).toContain('100,000');
  expect(hud.p1).toContain('30,000');
});

test('화투패 🎴 가 게임 화면 어디에도 노출되지 않음 (CONFIG/DOM/cell 모달)', async ({ page }) => {
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  await frame.waitForFunction(() => document.querySelectorAll('.cell').length > 0, null, { timeout: 10_000 });

  // 1) CONFIG.cities 어느 곳에도 🎴 없음
  const configHasHwatu = await frame.evaluate(() => {
    const cfg = window.__GONGDO_MARBLE_CONFIG__;
    return JSON.stringify(cfg).includes('🎴');
  });
  expect(configHasHwatu).toBe(false);

  // 2) 보드 DOM 전체에 🎴 없음 (innerHTML + title 속성 포함)
  const domHasHwatu = await frame.evaluate(() => {
    const html = document.documentElement.innerHTML;
    const titles = Array.from(document.querySelectorAll('[title]')).map((el) => el.title).join('\n');
    return html.includes('🎴') || titles.includes('🎴');
  });
  expect(domHasHwatu).toBe(false);

  // 3) 황금카드 칸이 정상 존재 (cell.title 속성으로 검증) + 6개 이상
  const goldenCellTitles = await frame.evaluate(() => {
    return Array.from(document.querySelectorAll('.cell'))
      .map((c) => c.title || '')
      .filter((t) => /황금카드/.test(t));
  });
  // 40칸 보드의 황금카드 칸 (2/8/13/22/28/34) — 6개 이상
  expect(goldenCellTitles.length).toBeGreaterThanOrEqual(6);

  // 4) 황금카드 칸을 클릭해 cell-info 모달 → 아이콘이 🔑 로 표시
  // (cells 의 ico 속성이 모달의 .cell-info-emoji 에 렌더링됨)
  const firstGoldenIdx = await frame.evaluate(() => {
    const idx = Array.from(document.querySelectorAll('.cell')).findIndex((c) => /황금카드/.test(c.title || ''));
    return idx;
  });
  expect(firstGoldenIdx).toBeGreaterThanOrEqual(0);
  await frame.evaluate((idx) => {
    document.querySelectorAll('.cell')[idx].click();
  }, firstGoldenIdx);
  // cell-info 모달이 열릴 때까지 대기
  await frame.waitForFunction(() => !!document.querySelector('.cell-info-emoji'), null, { timeout: 5_000 });
  const modalCheck = await frame.evaluate(() => ({
    emoji: document.querySelector('.cell-info-emoji')?.textContent || '',
    type: document.querySelector('.cell-info-type')?.textContent || '',
  }));
  expect(modalCheck.emoji).toBe('🔑');
  expect(modalCheck.emoji).not.toBe('🎴');
  expect(modalCheck.type).toContain('황금카드');
});
