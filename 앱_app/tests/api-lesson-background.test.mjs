/**
 * /api/lesson-background 핸들러 — 입력 검증·환경 가드 단위 테스트.
 * 실제 OpenAI 호출은 fetch 를 stub 으로 가로채서 검증.
 */
import test from 'node:test';
import { strict as assert } from 'node:assert';
import handler from '../api/lesson-background.js';
import { mockReq, mockRes, withEnv } from './_mockReqRes.mjs';

test('lesson-background — GET 거부 (405)', async () => {
  const res = mockRes();
  await handler(mockReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body?.error, 'method_not_allowed');
});

test('lesson-background — OPENAI_API_KEY 미설정 시 500', async () => {
  await withEnv({ OPENAI_API_KEY: undefined }, async () => {
    const res = mockRes();
    await handler(mockReq({ body: JSON.stringify({ prompt: 'test' }) }), res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body?.error, 'missing_openai_api_key');
  });
});

test('lesson-background — 빈 prompt 시 400', async () => {
  await withEnv({ OPENAI_API_KEY: 'sk-test' }, async () => {
    const res = mockRes();
    await handler(mockReq({ body: '{}' }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body?.error, 'missing_prompt');
  });
});

test('lesson-background — string body 도 JSON 파싱', async () => {
  await withEnv({ OPENAI_API_KEY: 'sk-test' }, async () => {
    const res = mockRes();
    await handler(mockReq({ body: '{"prompt":""}' }), res);
    // 빈 prompt 라 400 — 파싱 자체는 성공
    assert.equal(res.statusCode, 400);
  });
});

test('lesson-background — board kind 기본 (kind 미지정)', async () => {
  // fetch stub 으로 실제 호출 가로채고 prompt 내용 검증
  await withEnv({ OPENAI_API_KEY: 'sk-test' }, async () => {
    const origFetch = globalThis.fetch;
    let captured = null;
    globalThis.fetch = async (url, opts) => {
      captured = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({ data: [{ b64_json: 'mockb64' }] }),
      };
    };
    try {
      const res = mockRes();
      await handler(mockReq({ body: JSON.stringify({ prompt: '하늘색' }) }), res);
      assert.equal(res.statusCode, 200);
      assert.match(captured.prompt, /board game board/i, 'board 프롬프트 사용');
      assert.equal(captured.size, '1024x1024');
      assert.equal(captured.quality, 'low');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

test('lesson-background — kind:dice 선택 시 dice 프롬프트', async () => {
  await withEnv({ OPENAI_API_KEY: 'sk-test' }, async () => {
    const origFetch = globalThis.fetch;
    let captured = null;
    globalThis.fetch = async (url, opts) => {
      captured = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({ data: [{ b64_json: 'mockb64' }] }),
      };
    };
    try {
      const res = mockRes();
      await handler(mockReq({ body: JSON.stringify({ prompt: '강아지', kind: 'dice' }) }), res);
      assert.equal(res.statusCode, 200);
      assert.match(captured.prompt, /SIX-SIDED DIE/, 'dice 프롬프트 사용');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

test('lesson-background — OpenAI 응답 imageUrl 정확 추출 (b64_json)', async () => {
  await withEnv({ OPENAI_API_KEY: 'sk-test' }, async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ data: [{ b64_json: 'AAAA' }] }),
    });
    try {
      const res = mockRes();
      await handler(mockReq({ body: JSON.stringify({ prompt: '테스트' }) }), res);
      assert.equal(res.statusCode, 200);
      // lesson-background.js 가 output_format='webp' 로 호출하므로 mime 도 webp
      assert.equal(res.body?.imageUrl, 'data:image/webp;base64,AAAA');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

test('lesson-background — OpenAI 에러 시 같은 status 전파', async () => {
  await withEnv({ OPENAI_API_KEY: 'sk-test' }, async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'invalid_api_key', message: '키 잘못됐어요' } }),
    });
    try {
      const res = mockRes();
      await handler(mockReq({ body: JSON.stringify({ prompt: '테스트' }) }), res);
      assert.equal(res.statusCode, 401);
      assert.equal(res.body?.error, 'invalid_api_key');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
