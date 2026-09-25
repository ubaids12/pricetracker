export async function withRetry(operation, { attempts = 3, delayMs = 250, maxDelayMs = 4000, onRetry, onAttempt, returnMeta = false } = {}) {
  if (attempts < 1) throw new Error('Retry attempts must be at least 1');
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const startedAt = new Date().toISOString();
    try {
      const value = await operation(attempt);
      await onAttempt?.({ attempt, outcome: 'success', startedAt, finishedAt: new Date().toISOString(), value });
      const result = { value, attempts: attempt };
      return returnMeta ? result : result.value;
    } catch (error) {
      lastError = error;
      const willRetry = attempt < attempts;
      await onAttempt?.({ attempt, outcome: willRetry ? 'retried' : 'failed', startedAt, finishedAt: new Date().toISOString(), error });
      if (!willRetry) break;
      const waitMs = Math.min(delayMs * 2 ** (attempt - 1), maxDelayMs);
      onRetry?.({ attempt, nextAttempt: attempt + 1, waitMs, error });
      if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}
