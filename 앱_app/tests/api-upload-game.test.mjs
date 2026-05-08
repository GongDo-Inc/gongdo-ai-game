/**
 * /api/upload-game 핸들러 — 입력 검증·사이즈 가드 단위 테스트.
 * Supabase 호출은 실제로 안 하지만, 환경 가드와 사이즈 한계까지는 충분히 검증.
 */
import test from 'node:test';
import { strict as assert } from 'node:assert';
import handler from '../api/upload-game.js';
import { mockReq, mockRes, withEnv } from './_mockReqRes.mjs';

test('upload-game — GET 거부 (405)', async () => {
  const res = mockRes();
  await handler(mockReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
});

test('upload-game — html 비어있으면 400', async () => {
  const res = mockRes();
  await handler(mockReq({ body: JSON.stringify({ html: '' }) }), res);
  assert.equal(res.statusCode, 400);
});

test('upload-game — html 형식 잘못되면 400 (DOCTYPE/html 없음)', async () => {
  const res = mockRes();
  await handler(mockReq({ body: JSON.stringify({ html: '<div>not a full doc</div>' }) }), res);
  assert.equal(res.statusCode, 400);
});

test('upload-game — 5MB 초과 시 413', async () => {
  // 5MB 1바이트 초과
  const oversized = '<!DOCTYPE html><html>' + 'x'.repeat(5 * 1024 * 1024) + '</html>';
  const res = mockRes();
  await handler(mockReq({ body: JSON.stringify({ html: oversized }) }), res);
  assert.equal(res.statusCode, 413);
  assert.match(res.body?.error || '', /너무 커요/);
});

test('upload-game — 5MB 이하 + Supabase 미설정 시 500', async () => {
  await withEnv({ SUPABASE_URL: undefined, SUPABASE_ANON_KEY: undefined }, async () => {
    const res = mockRes();
    await handler(mockReq({ body: JSON.stringify({ html: '<!DOCTYPE html><html>ok</html>' }) }), res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body?.error || '', /Supabase/);
  });
});

test('upload-game — body 가 string 이면 자동 JSON 파싱', async () => {
  // 잘못된 JSON 문자열 전달 → body = {} 로 fallback → html 없음 → 400
  const res = mockRes();
  await handler(mockReq({ body: 'not-json' }), res);
  assert.equal(res.statusCode, 400);
});
