import { createRequire } from 'node:module';

const require = createRequire(new URL('../backend/package.json', import.meta.url));
const { chromium } = require('playwright');
const productName = process.argv.slice(2).join(' ') || 'Redwick VR Headset One';
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
try {
	const page = await browser.newPage();
	await page.goto('https://demo.inelabteamdev.com/', { waitUntil: 'networkidle', timeout: 60000 });
	for (let pageNumber = 1; pageNumber <= 48; pageNumber += 1) {
		const consent = page.locator('[role="dialog"], .consent-box').first();
		if (await consent.count()) await consent.getByRole('button', { name: /accept|agree|continue|necessary|reject/i }).first().click().catch(() => {});
		const card = page.locator('article.card').filter({ hasText: productName });
		if (await card.count()) {
			await card.getByRole('button', { name: /open item/i }).click();
			await page.waitForLoadState('networkidle').catch(() => {});
			console.log(JSON.stringify({ url: page.url(), text: await page.locator('body').innerText() }, null, 2));
			break;
		}
		if (pageNumber < 48) {
			await page.getByRole('button', { name: /next/i }).click();
			await page.waitForTimeout(150);
		}
	}
} finally {
	await browser.close();
}