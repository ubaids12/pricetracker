import test from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../../src/scraper/retry.js';

test('retry resolves after a transient failure', async () => { let calls = 0; const value = await withRetry(async () => { calls += 1; if (calls < 2) throw new Error('temporary'); return 'ok'; }, { delayMs: 0 }); assert.equal(value, 'ok'); });

test('retry reports retried and successful attempts with UTC timestamps', async () => {
	let calls = 0;
	const attempts = [];
	await withRetry(async () => { calls += 1; if (calls === 1) throw new Error('temporary'); return 'ok'; }, {
		delayMs: 0,
		onAttempt: (attempt) => attempts.push(attempt)
	});
	assert.equal(attempts.length, 2);
	assert.equal(attempts[0].outcome, 'retried');
	assert.equal(attempts[0].error.message, 'temporary');
	assert.equal(attempts[1].outcome, 'success');
	assert.match(attempts[1].startedAt, /^\d{4}-\d{2}-\d{2}T/);
});
