import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, getEditorValue } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('앱 로드 — 헤더, 차시 트리, 에디터', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1.app-title')).toContainText('공도 AI-Game');
  await expect(page.locator('#btn-start')).toBeVisible();
  await expect(page.locator('#editor-textarea')).toBeVisible();
  // 차시 트리 4개 (manifest.json)
  const folders = page.locator('#drawer-lessons .tree-folder');
  await expect(folders).toHaveCount(4);
});

test('차시 1 선택 → 에디터에 lesson1 본문 로드', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);
  const v = await getEditorValue(page);
  expect(v).toContain('# 1차시');
  expect(v).toContain('### 플레이어 핀');
  expect(v).toContain('## 보드 색상');
});

test('차시별 도구바 게이트 — 1차시 음악·캐릭터, 2차시 캐릭터, 3차시 배경 disabled', async ({ page }) => {
  await page.goto('/');
  await selectLesson(page, 1);
  await expect(page.locator('#btn-bgm')).toBeDisabled();         // 1차시 음악 게이트
  await expect(page.locator('#btn-character')).toBeDisabled();   // 1차시 캐릭터 잠금 (refreshCharacterButtonState)
  // 1차시 theme 는 학생이 보드 색상 프롬프트 삽입할 수 있게 ENABLED 유지

  await selectLesson(page, 2);
  await expect(page.locator('#btn-bgm')).not.toBeDisabled();
  await expect(page.locator('#btn-character')).toBeDisabled();   // 2차시 캐릭터 게이트
  await expect(page.locator('#btn-theme')).not.toBeDisabled();

  await selectLesson(page, 3);
  await expect(page.locator('#btn-bgm')).not.toBeDisabled();
  await expect(page.locator('#btn-theme')).toBeDisabled();        // 3차시 배경 게이트
});
