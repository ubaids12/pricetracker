import { env } from '../config/env.js';

export function requireCronSecret(request, response, next, { secret = env.cronSecret } = {}) {
  if (!secret || request.get('x-cron-secret') !== secret) return response.status(401).json({ error: 'Unauthorized' });
  next();
}
