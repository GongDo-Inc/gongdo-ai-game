/**
 * Lesson 1 → Lesson 2 인계 (mergeInheritedLessonDoc) 회귀 방어.
 * 학생 작업 손실 방지의 핵심 로직 — 절대 깨지면 안 되는 영역.
 */
import test from 'node:test';
import { strict as assert } from 'node:assert';
import { loadAppHelpers } from './_loadApp.mjs';

const H = await loadAppHelpers();

// 실제 lesson 문서와 동일한 구조의 mock — 마지막에 다음 heading or `---` 필요 (sectionBlock 종료 lookahead)
const LESSON1_MODIFIED = `# 1차시
### 플레이어 핀
- **나** : 핑크 핀
- **친구**: 노란 핀

### 주사위
- 강아지 주사위

## 보드판
- 12칸 보드판

## 보드 색상
- 노을 하늘처럼

### 조작 방법
- 끝
`;

const LESSON2_BASE = `# 2차시
### 플레이어 핀
- **나** : 빨간 핀
- **친구**: 파란 핀

### 주사위
- 기본 주사위

## 보드판
- 12칸 보드판

## 보드 색상
- 기본 보드

### 음악
- 기본 음악

### 도시 목록
- 1칸 : 한국 서울: 경복궁 / 5000골드

### 규칙
- 출발 칸 통과: +2000골드

---
`;

// ─────────── 정상 인계 ───────────

test('mergeInheritedLessonDoc — 핀 색상 인계', () => {
  const merged = H.mergeInheritedLessonDoc(LESSON2_BASE, LESSON1_MODIFIED);
  assert.match(merged, /- \*\*나\*\* : 핑크 핀/);
  assert.match(merged, /- \*\*친구\*\*: 노란 핀/);
  assert.doesNotMatch(merged, /- \*\*나\*\* : 빨간 핀/, 'lesson 2 의 빨간 핀이 덮어써져야 함');
});

test('mergeInheritedLessonDoc — 주사위 인계', () => {
  const merged = H.mergeInheritedLessonDoc(LESSON2_BASE, LESSON1_MODIFIED);
  assert.match(merged, /- 강아지 주사위/);
  assert.doesNotMatch(merged, /- 기본 주사위/, 'lesson 2 의 기본 주사위가 덮어써져야 함');
});

test('mergeInheritedLessonDoc — 보드 색상 인계', () => {
  const merged = H.mergeInheritedLessonDoc(LESSON2_BASE, LESSON1_MODIFIED);
  assert.match(merged, /- 노을 하늘처럼/);
  assert.doesNotMatch(merged, /- 기본 보드/);
});

// ─────────── lesson 2 고유 섹션 보존 ───────────

test('mergeInheritedLessonDoc — lesson 1 에 없는 ### 음악 은 baseDoc 유지', () => {
  const merged = H.mergeInheritedLessonDoc(LESSON2_BASE, LESSON1_MODIFIED);
  assert.match(merged, /### 음악\n- 기본 음악/, 'lesson 1 에 음악 섹션 없으므로 lesson 2 base 가 유지');
});

test('mergeInheritedLessonDoc — lesson 1 에 없는 도시 목록은 baseDoc 유지', () => {
  const merged = H.mergeInheritedLessonDoc(LESSON2_BASE, LESSON1_MODIFIED);
  assert.match(merged, /### 도시 목록\n- 1칸 : 한국 서울: 경복궁/);
});

// ─────────── 가드 ───────────

test('mergeInheritedLessonDoc — prevDoc 비어있으면 baseDoc 그대로', () => {
  const merged = H.mergeInheritedLessonDoc(LESSON2_BASE, '');
  assert.equal(merged, LESSON2_BASE);
});

test('mergeInheritedLessonDoc — baseDoc 비어있으면 그대로', () => {
  const merged = H.mergeInheritedLessonDoc('', LESSON1_MODIFIED);
  assert.equal(merged, '');
});

test('mergeInheritedLessonDoc — prevDoc null 이면 baseDoc', () => {
  const merged = H.mergeInheritedLessonDoc(LESSON2_BASE, null);
  assert.equal(merged, LESSON2_BASE);
});

// ─────────── extractSectionBlock ───────────

test('extractSectionBlock — 헤딩 + 본문 추출', () => {
  const text = `### 플레이어 핀\n- **나** : 노란 핀\n\n### 주사위\n- 강아지${'\n\n---'}`;
  const block = H.extractSectionBlock(text, '플레이어 핀');
  assert.match(block, /^### 플레이어 핀/);
  assert.match(block, /노란 핀/);
  assert.doesNotMatch(block, /강아지/, '다음 섹션 본문은 제외');
});

test('extractSectionBlock — 없는 섹션은 빈 문자열', () => {
  assert.equal(H.extractSectionBlock(`### A\n- 1${'\n\n---'}`, '없는섹션'), '');
});

// ─────────── replaceSectionBlock ───────────

test('replaceSectionBlock — 섹션 본문만 교체 (헤딩 유지)', () => {
  const base = `### 주사위\n- 기본 주사위\n\n### 다음${'\n\n---'}`;
  const replacement = `### 주사위\n- 강아지 주사위`;
  const result = H.replaceSectionBlock(base, '주사위', replacement);
  assert.match(result, /### 주사위\n- 강아지 주사위/);
  assert.match(result, /### 다음/);
  assert.doesNotMatch(result, /기본 주사위/);
});

test('replaceSectionBlock — 대상 섹션 없으면 원본 그대로', () => {
  const base = `### A\n- 1${'\n\n---'}`;
  const result = H.replaceSectionBlock(base, '없는섹션', `### 없는섹션\n- 새거`);
  assert.equal(result, base);
});
