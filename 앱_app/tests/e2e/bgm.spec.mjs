import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, clickStart, waitForGameIframe } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('lesson 2 — 도구바 🎵 popover 에서 AI 음악 자동 적용 → applied state 보존', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // 음악 popover 열기
  await page.locator('#btn-bgm').click();
  await expect(page.locator('#bgm-popover')).toBeVisible();

  // AI 음악 프롬프트 입력 후 [만들기]
  await page.locator('#bgm-ai-input').fill('신나는 우주 전투');
  await page.locator('#btn-bgm-generate').click();

  // 자동 적용 — 수동 [✅ 넣기] 버튼 클릭 없이 state 저장됨
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.getAppliedScore?.());
  }, { timeout: 5000 }).toBe(true);
});

test('lesson 2 — ### 음악 doc 프롬프트 → 자동 generateAndApply 호출', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // ### 음악 섹션을 비-기본으로 변경
  await page.evaluate(() => {
    const el = document.getElementById('editor-textarea');
    el.value = el.value.replace('- 기본 음악', '- 신나는 우주 전투');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await clickStart(page);
  await waitForGameIframe(page);

  // doc prompt 로 자동 생성된 score 가 appliedToGame 에 들어감
  const score = await page.evaluate(() => window.GongdoBGM?.getAppliedScore?.());
  expect(score).toBeTruthy();
  expect(typeof score.tempo).toBe('number');
});

test('lesson 2 — 마블 HTML 에 BGM 스크립트(Tone.js + player) 주입', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // popover 로 음악 적용 (자동 적용 — [✅ 넣기] 클릭 불필요)
  await page.locator('#btn-bgm').click();
  await page.locator('#bgm-ai-input').fill('테스트 음악');
  await page.locator('#btn-bgm-generate').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.getAppliedScore?.());
  }).toBe(true);

  // 시작 → 마블 HTML 안에 Tone.js + __SCORE__ 주입됐는지
  await clickStart(page);
  const frame = await waitForGameIframe(page);
  const html = await frame.content();
  expect(html).toContain('cdn.jsdelivr.net/npm/tone');
  expect(html).toContain('__SCORE__');
});

test('lesson 1 — 음악 버튼 disabled 라 popover 적용 불가', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);
  await expect(page.locator('#btn-bgm')).toBeDisabled();
});

// ─────────── 자동 적용 (수동 [✅ 넣기] 버튼 없이) ───────────

test('lesson 2 — AI 음악 생성 즉시 자동 적용 (수동 [✅ 넣기] 클릭 불필요)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // 적용 전 상태
  const before = await page.evaluate(() => !!window.GongdoBGM?.getAppliedScore?.());
  expect(before).toBe(false);

  await page.locator('#btn-bgm').click();
  await page.locator('#bgm-ai-input').fill('테스트 자동 적용');
  await page.locator('#btn-bgm-generate').click();

  // [✅ 넣기] 버튼 클릭 없이 — 생성 직후 state.appliedToGame 설정됨
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.getAppliedScore?.());
  }, { timeout: 5_000 }).toBe(true);

  // 수동 apply 버튼은 hidden 으로 숨겨져 있음 (자동 적용으로 redundant)
  await expect(page.locator('#btn-bgm-apply')).toBeHidden();
});

test('lesson 2 — 자동 적용 후 mood 이름이 banner 에 표시', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  await page.locator('#btn-bgm').click();
  await page.locator('#bgm-ai-input').fill('차분한 클래식');
  await page.locator('#btn-bgm-generate').click();
  await expect.poll(async () => {
    return page.evaluate(() => window.GongdoBGM?.state?.appliedToGame?.mood || null);
  }).toBeTruthy();
  // bgm-applied-badge 가 노출 + mood 라벨 채워짐
  await expect(page.locator('#bgm-applied-badge')).toBeVisible();
  await expect(page.locator('#bgm-applied-mood')).not.toHaveText('—');
});

// ─────────── 도구바 토글 (정지 ↔ 실행) ───────────

test('lesson 2 — 도구바 라벨이 음악 적용 전엔 "음악", 적용 후 "음악 정지/실행" 으로 변경', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // 적용 전: 라벨 = "음악", 아이콘 = "🎵"
  await expect(page.locator('#btn-bgm-label')).toHaveText('음악');

  // popover 로 음악 생성 → 자동 적용
  await page.locator('#btn-bgm').click();
  await page.locator('#bgm-ai-input').fill('토글 테스트 음악');
  await page.locator('#btn-bgm-generate').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.getAppliedScore?.());
  }).toBe(true);

  // 적용 + 재생 중 → 라벨 "음악 정지"
  await expect(page.locator('#btn-bgm-label')).toHaveText('음악 정지');
  // 아이콘은 ⏸ (재생 중)
  const icon1 = await page.evaluate(() => {
    return document.querySelector('#btn-bgm span[aria-hidden="true"]:not(.character-lock-icon)')?.textContent;
  });
  expect(icon1).toBe('⏸');
});

test('lesson 2 — 도구바 클릭으로 정지 ↔ 실행 토글', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);

  // 음악 생성·적용
  await page.locator('#btn-bgm').click();
  await page.locator('#bgm-ai-input').fill('토글 시나리오');
  await page.locator('#btn-bgm-generate').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.getAppliedScore?.());
  }).toBe(true);

  // popover 영역 외부 클릭으로 popover 닫기
  await page.locator('h1.app-title').click();
  await page.waitForTimeout(300);

  // 도구바 클릭 → 정지 (현재 재생 중)
  await page.locator('#btn-bgm').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.state?.isPlaying);
  }, { timeout: 3_000 }).toBe(false);
  await expect(page.locator('#btn-bgm-label')).toHaveText('음악 실행');

  // 다시 도구바 클릭 → 실행
  await page.locator('#btn-bgm').click();
  await expect.poll(async () => {
    return page.evaluate(() => !!window.GongdoBGM?.state?.isPlaying);
  }, { timeout: 3_000 }).toBe(true);
  await expect(page.locator('#btn-bgm-label')).toHaveText('음악 정지');
});

test('lesson 2 — 음악 미적용 시 도구바 클릭 → popover 열림 (생성 흐름 진입)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 2);
  // 적용된 음악 없음 → 클릭 시 popover 토글
  await expect(page.locator('#bgm-popover')).toBeHidden();
  await page.locator('#btn-bgm').click();
  await expect(page.locator('#bgm-popover')).toBeVisible();
});

// ─────────── 3차시 ### 음악 섹션 (lesson 2 와 동일 흐름) ───────────

test('lesson 3 — ### 음악 doc 프롬프트 → 자동 generateAndApply (lesson 2 와 동일 흐름)', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 3);
  // lesson 3 도 ### 음악 섹션 있음 (신규 통일)
  await page.evaluate(() => {
    const el = document.getElementById('editor-textarea');
    el.value = el.value.replace('- 기본 음악', '- 차분한 재즈');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await clickStart(page);
  await waitForGameIframe(page);

  const score = await page.evaluate(() => window.GongdoBGM?.getAppliedScore?.());
  expect(score).toBeTruthy();
});
