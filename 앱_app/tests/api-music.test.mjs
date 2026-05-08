/**
 * /api/music 핸들러 — 입력 검증·환경 가드 단위 테스트.
 */
import test from 'node:test';
import { strict as assert } from 'node:assert';
import handler from '../api/music.js';
import { mockReq, mockRes, withEnv } from './_mockReqRes.mjs';

test('music — GET 거부 (405)', async () => {
  const res = mockRes();
  await handler(mockReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
});

test('music — 빈 prompt 시 400', async () => {
  const res = mockRes();
  await handler(mockReq({ body: JSON.stringify({ prompt: '' }) }), res);
  assert.equal(res.statusCode, 400);
});

test('music — ANTHROPIC_API_KEY 미설정 시 500 (환경 오류 메시지)', async () => {
  await withEnv({ ANTHROPIC_API_KEY: undefined }, async () => {
    const res = mockRes();
    await handler(mockReq({ body: JSON.stringify({ prompt: '신나는 음악' }) }), res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body?.error, 'configuration_error');
  });
});

test('music — prompt 200자 초과는 잘려도 통과 (사이즈 거부 X)', async () => {
  await withEnv({ ANTHROPIC_API_KEY: undefined }, async () => {
    // 환경 오류로 빠지지만 — prompt 길이 자체는 거부 안 함
    const res = mockRes();
    await handler(mockReq({ body: JSON.stringify({ prompt: 'a'.repeat(500) }) }), res);
    assert.equal(res.statusCode, 500); // 환경 오류 단계
  });
});
