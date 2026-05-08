/**
 * /api/chat 핸들러 — 입력 검증·mode 분기·환경 가드 단위 테스트.
 */
import test from 'node:test';
import { strict as assert } from 'node:assert';
import handler from '../api/chat.js';
import { mockReq, mockRes, withEnv } from './_mockReqRes.mjs';

test('chat — GET 거부 (405)', async () => {
  const res = mockRes();
  await handler(mockReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
});

test('chat — 빈 document 시 400', async () => {
  const res = mockRes();
  await handler(mockReq({ body: JSON.stringify({ document: '', mode: 'tutor' }) }), res);
  assert.equal(res.statusCode, 400);
});

test('chat — ANTHROPIC_API_KEY 미설정 시 500', async () => {
  await withEnv({ ANTHROPIC_API_KEY: undefined }, async () => {
    const res = mockRes();
    await handler(mockReq({
      body: JSON.stringify({ document: '안녕하세요', mode: 'tutor' }),
    }), res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body?.error, 'configuration_error');
  });
});

test('chat — 알 수 없는 mode 는 generator 로 fallback (rate limit 까지 도달)', async () => {
  // ANTHROPIC_API_KEY 없으면 500 으로 빠지지만, 그 전 단계까지의 흐름 검증.
  await withEnv({ ANTHROPIC_API_KEY: undefined }, async () => {
    const res = mockRes();
    await handler(mockReq({
      body: JSON.stringify({ document: '뭔가', mode: 'unknown_mode' }),
    }), res);
    // 환경 오류로 500 — 모드 미지원이라 400 이 아님 (generator 로 fallback)
    assert.equal(res.statusCode, 500);
  });
});

test('chat — string body 자동 JSON 파싱', async () => {
  await withEnv({ ANTHROPIC_API_KEY: undefined }, async () => {
    const res = mockRes();
    await handler(mockReq({ body: '{"document":"x","mode":"tutor"}' }), res);
    assert.equal(res.statusCode, 500);
  });
});

test('chat — 잘못된 JSON 도 안전하게 처리 (빈 body 처럼)', async () => {
  const res = mockRes();
  await handler(mockReq({ body: 'this is not json' }), res);
  // body 파싱 실패 → document 없음 → 400
  assert.equal(res.statusCode, 400);
});
