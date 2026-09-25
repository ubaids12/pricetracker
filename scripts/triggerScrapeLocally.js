const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
const response = await fetch(`${baseUrl}/api/scrape/run`, { method: 'POST', headers: { 'x-cron-secret': process.env.CRON_SECRET || 'change-me' } });
console.log(await response.text());
