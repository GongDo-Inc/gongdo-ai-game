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

// ─────────── parseLesson3Players (회귀: "슬기 핀" / "데니스 핀" 형식 캐릭터 인식) ───────────

const L3_PLAYER_BLOCK = (heroValue, aiValue) => `### 플레이어 핀\n- **주인공** : ${heroValue}\n- **AI친구** : ${aiValue}${END}`;

test('parseLesson3Players — 기본(빨간 핀/파란 핀) → 핀 모드', () => {
  const players = H.parseLesson3Players(L3_PLAYER_BLOCK('빨간 핀', '파란 핀'));
  assert.equal(players[0].pinColor, '#E63946');
  assert.equal(players[0].imageUrl, '');
  assert.equal(players[1].pinColor, '#3D7BA3');
});

test('parseLesson3Players — "데니스" 단독 → 캐릭터 모드 (기존 동작 유지)', () => {
  const players = H.parseLesson3Players(L3_PLAYER_BLOCK('데니스', '슬기'));
  assert.equal(players[0].name, '데니스');
  assert.match(players[0].imageUrl, /dennis\.png$/);
  assert.equal(players[1].name, '슬기');
  assert.match(players[1].imageUrl, /seulgi\.png$/);
});

test('parseLesson3Players — "데니스 핀" / "슬기 핀" → 캐릭터 모드 (회귀 방어)', () => {
  // 학생이 "빨간 핀" 에서 색만 바꿔 "데니스 핀" 으로 입력하는 자연스러운 패턴.
  const players = H.parseLesson3Players(L3_PLAYER_BLOCK('데니스 핀', '슬기 핀'));
  assert.equal(players[0].name, '데니스');
  assert.match(players[0].imageUrl, /dennis\.png$/, '주인공 = 데니스 캐릭터 이미지');
  assert.equal(players[1].name, '슬기');
  assert.match(players[1].imageUrl, /seulgi\.png$/, 'AI친구 = 슬기 캐릭터 이미지');
});

test('parseLesson3Players — 혼합 ("데니스 핀" / "파란 핀") → 1명만 캐릭터', () => {
  const players = H.parseLesson3Players(L3_PLAYER_BLOCK('데니스 핀', '파란 핀'));
  assert.match(players[0].imageUrl, /dennis\.png$/);
  assert.equal(players[1].imageUrl, '');
  assert.equal(players[1].pinColor, '#3D7BA3');
});

// ─────────── _findHintPos (회귀: 3차시 bold list-item 매칭) ───────────

const L3_DOC = `### 플레이어 핀\n- **주인공** : 빨간 핀\n- **AI친구** : 파란 핀\n\n### 주사위\n- 기본 주사위\n${END}`;

test('_findHintPos — bold + 콜론 공백 줄에 [HINT:- 주인공:] 매칭 (회귀 방어)', () => {
  // AI 튜터가 시스템 프롬프트 예시 그대로 [HINT:- 주인공:] 를 보낼 때
  // lesson3.md 의 `- **주인공** : 빨간 핀` 줄을 찾아야 함.
  const pos = H._findHintPos(L3_DOC, '- 주인공:');
  assert.ok(pos >= 0, '매칭 실패 — bold tolerant 폴백이 동작해야 함');
  const lineIdx = L3_DOC.slice(0, pos).split('\n').length;
  assert.equal(lineIdx, 2, '"- **주인공** : ..." 줄(line 2) 에 매칭되어야 함');
});

test('_findHintPos — [HINT:주인공:] (대시 없음) 도 bold 줄에 매칭', () => {
  const pos = H._findHintPos(L3_DOC, '주인공:');
  assert.ok(pos >= 0);
  const lineIdx = L3_DOC.slice(0, pos).split('\n').length;
  assert.equal(lineIdx, 2);
});

test('_findHintPos — [HINT:### 플레이어 핀] 헤딩 직접 매칭 (기존 경로 유지)', () => {
  const pos = H._findHintPos(L3_DOC, '### 플레이어 핀');
  assert.ok(pos >= 0);
  const lineIdx = L3_DOC.slice(0, pos).split('\n').length;
  assert.equal(lineIdx, 1);
});

test('_findHintPos — bold 없는 1차시 형식 줄에도 그대로 매칭 (퇴행 없음)', () => {
  const lesson1Doc = `### 플레이어 핀\n- 주인공: 빨간 핀\n- 적: 파란 핀${END}`;
  const pos = H._findHintPos(lesson1Doc, '- 주인공:');
  assert.ok(pos >= 0);
  const lineIdx = lesson1Doc.slice(0, pos).split('\n').length;
  assert.equal(lineIdx, 2);
});
