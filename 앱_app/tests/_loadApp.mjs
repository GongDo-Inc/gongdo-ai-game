/**
 * app.js 의 IIFE 안 순수 헬퍼 함수들을 Node 테스트 환경에서 추출하는 sandbox 로더.
 *
 * 동작:
 *   1. globalThis.__GONGDO_TEST_EXPORTS = {} 설정
 *   2. document/window 등 최소 stub 으로 vm context 생성
 *   3. app.js 실행 — IIFE 끝의 conditional hook 이 함수 ref 를 __GONGDO_TEST_EXPORTS 에 주입
 *   4. helpers 객체 반환
 *
 * production 영향: app.js 의 hook 은 globalThis.__GONGDO_TEST_EXPORTS 가 truthy 일 때만 실행되며,
 * 일반 브라우저 환경에선 undefined 라 no-op. 즉 이 파일이 호출될 때만 export 가 모임.
 */

import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_PATH = path.join(__dirname, '..', 'public', 'js', 'app.js');

let cached = null;

export async function loadAppHelpers() {
  if (cached) return cached;
  const src = await readFile(APP_PATH, 'utf8');

  const noop = () => {};
  const exports = {};

  // app.js IIFE 의 top-level statements 가 의존하는 최소 stub.
  //   - document.addEventListener('DOMContentLoaded', ...)  ← 콜백은 fire 안 함
  //   - window.GongdoApp = Object.assign(window.GongdoApp || {}, ...)
  //   - if (typeof globalThis !== 'undefined' && globalThis.__GONGDO_TEST_EXPORTS) Object.assign(...)
  const fakeWin = {
    addEventListener: noop,
    location: { origin: 'http://localhost:3000' },
  };
  const fakeDoc = {
    addEventListener: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
  };

  const sandbox = {
    document: fakeDoc,
    window: fakeWin,
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    console: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
    setTimeout, clearTimeout, setInterval, clearInterval,
    URL, URLSearchParams,
    fetch: () => Promise.reject(new Error('fetch not available in test sandbox')),
    Promise, Object, Array, Map, Set, JSON, Math, Date, RegExp, Number, String, Boolean,
    TextEncoder, TextDecoder,
    __GONGDO_TEST_EXPORTS: exports,
  };
  // globalThis self-ref so `typeof globalThis !== 'undefined' && globalThis.__GONGDO_TEST_EXPORTS` 통과
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'app.js' });

  cached = exports;
  return exports;
}
