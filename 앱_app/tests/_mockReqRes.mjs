/**
 * Vercel/dev-server 형식의 req/res 객체 mock — API 핸들러 단위 테스트용.
 */

export function mockReq({ method = 'POST', body = '', headers = {} } = {}) {
  return {
    method,
    body,
    headers: { 'x-forwarded-for': '127.0.0.1', ...headers },
    socket: { remoteAddress: '127.0.0.1' },
    url: '/api/test',
  };
}

export function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      this.ended = true;
      return this;
    },
    send(text) {
      this.body = text;
      this.ended = true;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(data) {
      if (data !== undefined) this.body = data;
      this.ended = true;
    },
  };
  return res;
}

/** 테스트 동안만 process.env 변수를 덮어썼다가 복원 */
export function withEnv(overrides, fn) {
  const orig = {};
  for (const k of Object.keys(overrides)) {
    orig[k] = process.env[k];
    if (overrides[k] === undefined) delete process.env[k];
    else process.env[k] = overrides[k];
  }
  return Promise.resolve(fn()).finally(() => {
    for (const k of Object.keys(orig)) {
      if (orig[k] === undefined) delete process.env[k];
      else process.env[k] = orig[k];
    }
  });
}
