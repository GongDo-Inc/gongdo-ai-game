/**
 * Phase 1 단위 테스트 — app.js 안 순수 parser 함수들의 회귀 방어.
 * sandbox 로 app.js 를 실제 실행해 함수 ref 추출 → 실제 코드와 1:1 동기화.
 *
 * 주의: sectionBlock 정규식은 다음 heading 또는 `---` 를 종료 lookahead 로 요구하므로
 * 테스트 입력 문자열은 항상 `\n\n---` 또는 후속 heading 으로 끝내야 함.
 */
import test from 'node:test';
import { strict as assert } from 'node:assert';
import { loadAppHelpers } from './_loadApp.mjs';

const H = await loadAppHelpers();

const END = '\n\n---';

// ─────────── parseCities ───────────

test('parseCities — N칸 + 도시:랜드마크 / N골드 (full format)', () => {
  const text = `### 도시 목록\n- 1칸 : 한국 서울: 경복궁 / 5000골드${END}`;
  const r = H.parseCities(text);
  assert.equal(r.length, 1);
  assert.equal(r[0].index, 1);
  assert.equal(r[0].label, '한국 서울');
  assert.equal(r[0].landmark, '경복궁');
  assert.equal(r[0].toll, 5000);
});

test('parseCities — N칸 + 단일 라벨 / N골드 (학생 자유 입력)', () => {
  const text = `### 도시 목록\n- 7칸 : 유나네 집 / 5000골드${END}`;
  const r = H.parseCities(text);
  assert.equal(r.length, 1);
  assert.equal(r[0].index, 7);
  assert.equal(r[0].label, '유나네 집');
  assert.equal(r[0].toll, 5000);
});

test('parseCities — 콜론 뒤 공백 없어도 매칭', () => {
  const text = `### 도시 목록\n- 9칸 :유나네 집 / 5000골드${END}`;
  const r = H.parseCities(text);
  assert.equal(r[0].index, 9);
  assert.equal(r[0].label, '유나네 집');
});

test('parseCities — 빈칸 placeholder (___) 무시', () => {
  const text = `### 도시 목록\n- 11칸 : __________ / ____골드${END}`;
  const r = H.parseCities(text);
  assert.equal(r.length, 0);
});

test('parseCities — 인덱스 없는 freeSource', () => {
  const text = `### 도시 목록\n- 영국 런던: 빅벤 / 6200골드${END}`;
  const r = H.parseCities(text);
  assert.equal(r.length, 1);
  assert.equal(r[0].index, undefined);
  assert.equal(r[0].label, '영국 런던');
  assert.equal(r[0].landmark, '빅벤');
});

test('parseCities — 콤마 포함 toll 처리', () => {
  const text = `### 도시 목록\n- 1칸 : 서울: 경복궁 / 12,500골드${END}`;
  const r = H.parseCities(text);
  assert.equal(r[0].toll, 12500);
});

test('parseCities — 도시 목록 섹션 없으면 빈 배열', () => {
  const text = `### 다른 섹션\n- 뭔가${END}`;
  const r = H.parseCities(text);
  assert.equal(r.length, 0);
});

// ─────────── parseLessonOnePins ───────────

test('parseLessonOnePins — 노란/핑크 매칭 + colorMatched=true', () => {
  const text = `### 플레이어 핀\n- **나** : 노란 핀\n- **친구**: 핑크 핀${END}`;
  const r = H.parseLessonOnePins(text);
  assert.equal(r.length, 2);
  assert.equal(r[0].color, '#F7C548');
  assert.equal(r[0].colorMatched, true);
  assert.equal(r[1].color, '#F48FA0');
  assert.equal(r[1].colorMatched, true);
});

test('parseLessonOnePins — 미매핑 색상은 fallback + colorMatched=false', () => {
  const text = `### 플레이어 핀\n- **나** : 라벤더 핀\n- **친구**: 청록색 핀${END}`;
  const r = H.parseLessonOnePins(text);
  assert.equal(r[0].colorMatched, false, '라벤더는 미매핑');
  assert.equal(r[1].colorMatched, true, '청록색은 신규 매핑됨');
});

test('parseLessonOnePins — hex 직접 입력', () => {
  const text = `### 플레이어 핀\n- **나** : #ff0080 핀\n- **친구**: 빨간 핀${END}`;
  const r = H.parseLessonOnePins(text);
  assert.equal(r[0].color, '#ff0080');
  assert.equal(r[0].colorMatched, true);
});

test('parseLessonOnePins — 섹션 없으면 fallback 2명', () => {
  const text = `### 다른 섹션\n- 뭔가${END}`;
  const r = H.parseLessonOnePins(text);
  assert.equal(r.length, 2);
  assert.equal(r[0].name, '나');
  assert.equal(r[1].name, '친구');
});

// ─────────── parseDicePrompt ───────────

test('parseDicePrompt — "기본 주사위" 무시', () => {
  const text = `### 주사위\n- 기본 주사위${END}`;
  assert.equal(H.parseDicePrompt(text), '');
});

test('parseDicePrompt — 비-기본 라벨 추출', () => {
  const text = `### 주사위\n- 강아지 주사위${END}`;
  assert.equal(H.parseDicePrompt(text), '강아지 주사위');
});

test('parseDicePrompt — 빈 섹션', () => {
  const text = `### 주사위\n${END}`;
  assert.equal(H.parseDicePrompt(text), '');
});

// ─────────── parseLessonMusicPrompt ───────────

test('parseLessonMusicPrompt — "기본 음악" 무시', () => {
  const text = `### 음악\n- 기본 음악${END}`;
  assert.equal(H.parseLessonMusicPrompt(text), '');
});

test('parseLessonMusicPrompt — 묘사 추출', () => {
  const text = `### 음악\n- 신나는 우주 전투${END}`;
  assert.equal(H.parseLessonMusicPrompt(text), '신나는 우주 전투');
});

test('parseLessonMusicPrompt — "배경음악" 헤딩도 인식', () => {
  const text = `### 배경음악\n- 조용한 카페${END}`;
  assert.equal(H.parseLessonMusicPrompt(text), '조용한 카페');
});

// ─────────── parseLessonBackgroundPrompt ───────────

test('parseLessonBackgroundPrompt — "기본 보드" 무시', () => {
  const text = `## 보드 색상\n- 기본 보드${END}`;
  assert.equal(H.parseLessonBackgroundPrompt(text), '');
});

test('parseLessonBackgroundPrompt — 단순 색상명도 프롬프트', () => {
  const text = `## 보드 색상\n- 하늘색${END}`;
  assert.equal(H.parseLessonBackgroundPrompt(text), '하늘색');
});

test('parseLessonBackgroundPrompt — 묘사 프롬프트', () => {
  const text = `## 보드 색상\n- 노을 하늘처럼${END}`;
  assert.equal(H.parseLessonBackgroundPrompt(text), '노을 하늘처럼');
});

// ─────────── parseBoardCellCount ───────────

test('parseBoardCellCount — 12칸', () => {
  assert.equal(H.parseBoardCellCount(`## 보드판\n- 12칸 보드판${END}`), 12);
});

test('parseBoardCellCount — 40칸', () => {
  assert.equal(H.parseBoardCellCount(`## 보드판\n- 40칸 보드판${END}`), 40);
});

test('parseBoardCellCount — 미설정 시 12 default', () => {
  assert.equal(H.parseBoardCellCount(`### 다른 섹션\n${END}`), 12);
});

test('parseBoardCellCount — 4 ~ 40 범위 clamp', () => {
  assert.equal(H.parseBoardCellCount(`## 보드판\n- 100칸 보드판${END}`), 40);
  assert.equal(H.parseBoardCellCount(`## 보드판\n- 2칸 보드판${END}`), 4);
});

// ─────────── parseLessonOneDice ───────────

test('parseLessonOneDice — 별/하트/번개 키워드 매칭', () => {
  assert.equal(H.parseLessonOneDice(`### 주사위\n- 별 주사위${END}`).theme, 'star');
  assert.equal(H.parseLessonOneDice(`### 주사위\n- 하트 주사위${END}`).theme, 'heart');
  assert.equal(H.parseLessonOneDice(`### 주사위\n- 번개 주사위${END}`).theme, 'lightning');
});

test('parseLessonOneDice — 미매칭 키워드는 classic theme', () => {
  const r = H.parseLessonOneDice(`### 주사위\n- 강아지 주사위${END}`);
  assert.equal(r.theme, 'classic');
  assert.equal(r.label, '강아지 주사위');
});

// ─────────── numberFromText ───────────

test('numberFromText — 콤마 처리', () => {
  assert.equal(H.numberFromText('5,000', 0), 5000);
  assert.equal(H.numberFromText('100', 0), 100);
});

test('numberFromText — 빈/잘못된 입력 → fallback', () => {
  assert.equal(H.numberFromText('', 999), 999);
  assert.equal(H.numberFromText('___', 999), 999);
  assert.equal(H.numberFromText(null, 42), 42);
});

test('numberFromText — 음수 처리', () => {
  assert.equal(H.numberFromText('-1000', 0), -1000);
});
