/**
 * AI 튜터 — 각 차시에서 5회 이상 질문 흐름 회귀 테스트.
 *
 * 이전 버그: 튜터 응답에 [HINT:...] 가 포함되면 highlightEditorByHint 가 자동으로
 * editor.focus() + setSelectionRange 호출 → 학생이 무의식적으로 다음 질문 타자할 때
 * 실제로는 에디터에 입력되어 도시 목록 등이 사라지는 사고 발생.
 *
 * 수정: findEditorLineByHint (부수효과 없음) 로 line number 만 계산 + 자동 저장.
 *
 * 각 차시별로:
 *   1. 학생이 문서를 수정 (도시/주사위/음악 등)
 *   2. AI 튜터에게 5회 질문
 *   3. 매 질문 후 학생의 수정사항이 그대로 보존되는지 검증
 */
import { test, expect } from '@playwright/test';
import { setupMocks, selectLesson, replaceEditorLine, askTutor, getEditorValue } from './_helpers.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await page.goto('/');
});

const QUESTIONS = [
  '안녕하세요',
  '도시 어떤 거 추가하면 좋을까?',
  '영국은 수도가 어디야?',
  '빅벤은 어떤 건물이야?',
  '다른 나라는 없어?',
  '주사위 어떻게 바꿔?',
];

test('1차시 — 핀/주사위 수정 후 AI 튜터 5회 질문 → 수정 보존', async ({ page }) => {
  await selectLesson(page, 1);

  // 학생 수정
  await replaceEditorLine(page, '- **나** : 빨간 핀', '- **나** : 핑크 핀');
  await replaceEditorLine(page, '- 기본 주사위', '- 별 주사위');

  const before = await getEditorValue(page);
  expect(before).toContain('핑크 핀');
  expect(before).toContain('별 주사위');

  // 5회 + α 질문
  for (const q of QUESTIONS) {
    await askTutor(page, q);
    const v = await getEditorValue(page);
    expect(v).toContain('핑크 핀');         // 매 질문 후 보존
    expect(v).toContain('별 주사위');
  }

  // 최종 상태도 한번 더 확인
  const after = await getEditorValue(page);
  expect(after).toEqual(before);
});

test('2차시 — 도시 6개 채우고 AI 튜터 5회 질문 → 도시 목록 보존', async ({ page }) => {
  await selectLesson(page, 2);

  // 학생이 7~11칸 빈 도시를 채움 (실제 학생 흐름과 동일)
  await replaceEditorLine(page, '- 7칸 : __________ / ____골드', '- 7칸 : 영국 런던: 빅벤 / 6200골드');
  await replaceEditorLine(page, '- 8칸 : __________ / ____골드', '- 8칸 : 이집트 카이로: 피라미드 / 6400골드');
  await replaceEditorLine(page, '- 9칸 : __________ / ____골드', '- 9칸 : 호주 시드니: 오페라하우스 / 6600골드');
  await replaceEditorLine(page, '- 10칸 : __________ / ____골드', '- 10칸 : 브라질 리우: 예수상 / 6800골드');
  await replaceEditorLine(page, '- 11칸 : __________ / ____골드', '- 11칸 : 인도 뉴델리: 타지마할 / 7000골드');

  const before = await getEditorValue(page);
  expect(before).toContain('영국 런던');
  expect(before).toContain('인도 뉴델리');

  for (const q of QUESTIONS) {
    await askTutor(page, q);
    const v = await getEditorValue(page);
    // 각 도시가 매 질문 후에도 보존
    expect(v).toContain('영국 런던');
    expect(v).toContain('이집트 카이로');
    expect(v).toContain('호주 시드니');
    expect(v).toContain('브라질 리우');
    expect(v).toContain('인도 뉴델리');
    // ### 도시 목록 헤딩도 그대로
    expect(v).toContain('### 도시 목록');
  }

  const after = await getEditorValue(page);
  expect(after).toEqual(before);
});

test('3차시 — 주인공/도시 수정 후 AI 튜터 5회 질문 → 모두 보존', async ({ page }) => {
  await selectLesson(page, 3);

  await replaceEditorLine(page, '- 주인공: 데니스', '- 주인공: 슬기');
  await replaceEditorLine(page, '- 1칸 : 대한민국 서울: 경복궁 / 5000골드', '- 1칸 : 대한민국 서울: 경복궁 / 9999골드');

  const before = await getEditorValue(page);
  expect(before).toContain('주인공: 슬기');
  expect(before).toContain('9999골드');

  for (const q of QUESTIONS) {
    await askTutor(page, q);
    const v = await getEditorValue(page);
    expect(v).toContain('주인공: 슬기');
    expect(v).toContain('9999골드');
  }

  const after = await getEditorValue(page);
  expect(after).toEqual(before);
});

test('4차시 — 발표 자료 안내문에서 AI 튜터 5회 질문 → 본문 보존', async ({ page }) => {
  await selectLesson(page, 4);

  const before = await getEditorValue(page);
  expect(before).toContain('# 4차시');

  for (const q of QUESTIONS) {
    await askTutor(page, q);
    const v = await getEditorValue(page);
    // lesson 4 본문 핵심 마커 보존
    expect(v).toContain('# 4차시');
    expect(v).toContain('발표');
  }

  const after = await getEditorValue(page);
  expect(after).toEqual(before);
});

test('튜터 응답 후 editor 가 자동 focus 되지 않음 (포커스 도둑 회귀 방어)', async ({ page }) => {
  await selectLesson(page, 2);

  // 튜터 input 에 포커스 → 질문 전송
  await page.locator('#tutor-fab').click();
  await page.locator('#tutor-input').focus();
  await askTutor(page, '도시 추천해줘');

  // 응답 도착 후 — focus 가 editor 로 가지 않아야 함 (예전 버그 방지)
  const focused = await page.evaluate(() => document.activeElement?.id);
  expect(focused).not.toBe('editor-textarea');
});

test('1차시 — "보드 색상 바꾸고 싶어" 질문 → ## 보드 색상 라인 정확히 매칭 (line 21 오매칭 회귀 방어)', async ({ page }) => {
  await selectLesson(page, 1);

  // 학생 화면 기준 "## 보드 색상" 라인 번호 사전 계산
  const expectedLine = await page.evaluate(() => {
    const v = document.getElementById('editor-textarea').value;
    const idx = v.indexOf('## 보드 색상');
    if (idx < 0) return null;
    return v.slice(0, idx).split('\n').length;
  });
  expect(expectedLine).toBeGreaterThan(0);

  await askTutor(page, '보드 색상 바꾸고 싶어');

  // 마지막 bot 메시지의 줄 번호 배지 → 보드 색상 라인 매칭
  const badgeLineNumber = await page.evaluate(() => {
    const badges = document.querySelectorAll('.tutor-message-bot .tutor-hint-badge b');
    const last = badges[badges.length - 1];
    return last ? Number(last.textContent) : null;
  });

  expect(badgeLineNumber).toBe(expectedLine);
  // 회귀 방어 — line 21 (### 장르) 가 절대 아니어야 함
  expect(badgeLineNumber).not.toBe(21);
});

test('1차시 — "주사위 바꾸고 싶어" → ### 주사위 라인 매칭', async ({ page }) => {
  await selectLesson(page, 1);
  const expectedLine = await page.evaluate(() => {
    const v = document.getElementById('editor-textarea').value;
    const idx = v.indexOf('### 주사위');
    return idx >= 0 ? v.slice(0, idx).split('\n').length : null;
  });
  await askTutor(page, '주사위 바꾸고 싶어');
  const badgeLineNumber = await page.evaluate(() => {
    const badges = document.querySelectorAll('.tutor-message-bot .tutor-hint-badge b');
    return badges.length ? Number(badges[badges.length - 1].textContent) : null;
  });
  expect(badgeLineNumber).toBe(expectedLine);
});

test('hint 가 마크다운 토큰만 (### 도시 목록 — lesson 1 에 없음) → fallback 으로 ### 장르 잘못 매칭 안 함', async ({ page }) => {
  await selectLesson(page, 1);
  // mock 의 default hint 가 '### 도시 목록' 인데 lesson 1 에는 그 섹션 없음 →
  // 이전 버그: firstWord='###' fuzzy 검색 → 첫 ### 헤딩(### 장르 line 21) 잘못 매칭
  // 수정 후: markdown 토큰만인 firstWord 는 fallback skip → null 반환 (= 줄번호 배지 없음)
  await askTutor(page, '아무거나 물어볼게요');  // 어떤 카테고리에도 안 걸림 → default hint
  const badge = await page.locator('.tutor-message-bot .tutor-hint-badge').last();
  // 배지가 있더라도 검색 형식 ("🔍 문서에서 '...' 찾기") 이지 줄번호 형식이 아니어야
  const text = await badge.textContent().catch(() => '');
  // 줄번호 배지면 "📍" + <b>숫자</b>, 검색 배지면 "🔍"
  // "21" 이 들어있으면 안 됨 (line 21 = ### 장르)
  expect(text).not.toContain('21');
});
