import test from 'node:test';
import assert from 'node:assert/strict';
import { requireCronSecret } from '../../src/middleware/auth.js';

function requestWith(secret) { return { get: () => secret }; }
function responseDouble() { return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } }; }

test('cron auth rejects a missing or incorrect secret', () => {
  const response = responseDouble();
  requireCronSecret(requestWith('wrong'), response, () => {});
  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { error: 'Unauthorized' });
});

test('cron auth accepts the configured secret', () => {
  const response = responseDouble();
  let called = false;
  requireCronSecret(requestWith('test-secret'), response, () => { called = true; }, { secret: 'test-secret' });
  assert.equal(called, true);
});
