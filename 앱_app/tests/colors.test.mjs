/**
 * 색상 매핑 회귀 방어 — SIMPLE_COLOR_MAP 에서 한국어/영문 색상명이 정확히 RGB 로 변환되는지.
 * 핀 색상 적용 정확도가 학생 UX 의 핵심 — 매핑 누락이 사고로 이어진 적 있음.
 */
import test from 'node:test';
import { strict as assert } from 'node:assert';
import { loadAppHelpers } from './_loadApp.mjs';

const H = await loadAppHelpers();

// ─────────── 핵심 색상 (한국어) ───────────

test('resolveNamedColor — 빨간/파란/노란 (lesson 기본)', () => {
  assert.equal(H.resolveNamedColor('빨간', '#000'), '#E63946');
  assert.equal(H.resolveNamedColor('파란', '#000'), '#3D7BA3');
  assert.equal(H.resolveNamedColor('노란', '#000'), '#F7C548');
});

test('resolveNamedColor — 핑크/하늘색/청록 (신규 추가)', () => {
  assert.equal(H.resolveNamedColor('핑크', '#000'), '#F48FA0');
  assert.equal(H.resolveNamedColor('핑크색', '#000'), '#F48FA0');
  assert.equal(H.resolveNamedColor('하늘', '#000'), '#7CCFE8');
  assert.equal(H.resolveNamedColor('하늘색', '#000'), '#7CCFE8');
  assert.equal(H.resolveNamedColor('청록', '#000'), '#3FBFB3');
  assert.equal(H.resolveNamedColor('청록색', '#000'), '#3FBFB3');
});

test('resolveNamedColor — 황금/갈색/회색/연두', () => {
  assert.equal(H.resolveNamedColor('황금', '#000'), '#D4A017');
  assert.equal(H.resolveNamedColor('황금색', '#000'), '#D4A017');
  assert.equal(H.resolveNamedColor('갈색', '#000'), '#8B5A2B');
  assert.equal(H.resolveNamedColor('회색', '#000'), '#808080');
  assert.equal(H.resolveNamedColor('연두', '#000'), '#A8E060');
});

test('resolveNamedColor — 영문 매핑', () => {
  assert.equal(H.resolveNamedColor('red', '#000'), '#E63946');
  assert.equal(H.resolveNamedColor('blue', '#000'), '#3D7BA3');
  assert.equal(H.resolveNamedColor('pink', '#000'), '#F48FA0');
});

test('resolveNamedColor — hex 직접 입력', () => {
  assert.equal(H.resolveNamedColor('#abc123', '#fallback'), '#abc123');
  assert.equal(H.resolveNamedColor('#fff', '#fallback'), '#fff');
});

test('resolveNamedColor — 미매핑 색상은 fallback', () => {
  assert.equal(H.resolveNamedColor('라벤더', '#FALLBACK'), '#FALLBACK');
  assert.equal(H.resolveNamedColor('복숭아색', '#FALLBACK'), '#FALLBACK');
});

test('resolveNamedColor — 빈 입력은 fallback', () => {
  assert.equal(H.resolveNamedColor('', '#FALLBACK'), '#FALLBACK');
  assert.equal(H.resolveNamedColor(null, '#FALLBACK'), '#FALLBACK');
});

// ─────────── resolveNamedColorOrNull (Claude merge 신호용) ───────────

test('resolveNamedColorOrNull — 매핑된 건 RGB 반환', () => {
  assert.equal(H.resolveNamedColorOrNull('핑크'), '#F48FA0');
  assert.equal(H.resolveNamedColorOrNull('#abc'), '#abc');
});

test('resolveNamedColorOrNull — 미매핑은 null', () => {
  assert.equal(H.resolveNamedColorOrNull('라벤더'), null);
  assert.equal(H.resolveNamedColorOrNull(''), null);
});

test('resolveNamedColorOrNull — 공백 trim 후 매핑', () => {
  assert.equal(H.resolveNamedColorOrNull('  노란  '), '#F7C548');
});
