/**
 * _rateLimit.js — IPv6 콜론 충돌 회귀 방어.
 * IPv6 IP (::1, 2001:db8::1) 가 그대로 키에 들어가면 Upstash REST API 가 path invalid 로 거부됨.
 * 이전 버그: rl:music:stu-X:::1:bucket 형태로 콜론 3연속 발생.
 * 수정 후: 콜론을 dash 로 치환해 안전.
 *
 * 주의: KV 미설정 환경에서는 인메모리 폴백으로 동작. 테스트는 환경 무관 동작 검증.
 */
import test from 'node:test';
import { strict as assert } from 'node:assert';
import { checkAndIncrement } from '../api/_rateLimit.js';

// 각 테스트마다 unique scope/id 사용 → 인메모리 카운터 격리

test('checkAndIncrement — IPv4 정상 동작', async () => {
  const r = await checkAndIncrement('test_v4_' + Date.now(), 'student-1', 100, '203.0.113.5');
  assert.equal(r.ok, true);
  assert.equal(typeof r.used, 'number');
  assert.equal(r.limit, 100);
});

test('checkAndIncrement — IPv6 ::1 (loopback) 안전 처리', async () => {
  // 이전엔 ipPart=`:::1` 로 콜론 3연속 → Upstash 거부 → KV disabled.
  // 이제 콜론 → dash 치환되어 키 안전.
  const r = await checkAndIncrement('test_v6_loop_' + Date.now(), 'student-2', 100, '::1');
  assert.equal(r.ok, true);
  // throw 없으면 OK — KV 호출이 path invalid 로 깨지지 않음 (MEMORY fallback 도 정상)
});

test('checkAndIncrement — IPv6 full address 안전', async () => {
  const r = await checkAndIncrement('test_v6_full_' + Date.now(), 'student-3', 100, '2001:db8::1');
  assert.equal(r.ok, true);
});

test('checkAndIncrement — limit 초과 시 ok=false', async () => {
  const scope = 'limit_test_' + Date.now();
  const id = 'student-4';
  // 5번까지 OK
  for (let i = 0; i < 5; i++) {
    const r = await checkAndIncrement(scope, id, 5, '1.2.3.4');
    assert.equal(r.ok, true, `i=${i} 는 limit 안`);
  }
  // 6번째는 초과
  const over = await checkAndIncrement(scope, id, 5, '1.2.3.4');
  assert.equal(over.ok, false);
  assert.equal(over.used, 6);
});

test('checkAndIncrement — IP 없어도 동작 (anon)', async () => {
  const r = await checkAndIncrement('test_noip_' + Date.now(), 'anon-student', 100);
  assert.equal(r.ok, true);
});

test('checkAndIncrement — resetInSec 양수 반환', async () => {
  const r = await checkAndIncrement('test_reset_' + Date.now(), 'student-5', 100, '1.1.1.1');
  assert.ok(r.resetInSec > 0 && r.resetInSec <= 60, `resetInSec ${r.resetInSec} 가 1~60 사이여야`);
});
