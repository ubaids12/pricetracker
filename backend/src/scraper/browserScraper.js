import { chromium } from 'playwright';
import { env } from '../config/env.js';
import { parseProductHtml } from './parser.js';

function localExecutablePath() {
	if (env.browserExecutablePath) return env.browserExecutablePath;
	if (process.platform !== 'win32') return undefined;
	return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

async function dismissConsent(page) {
	const dialog = page.locator('[role="dialog"], .consent-box').first();
	if (!await dialog.count()) return;
	const action = dialog.getByRole('button', { name: /allow|accept|agree|continue|necessary|reject/i }).first();
	if (await action.count()) await action.click({ timeout: 3000 }).catch(() => {});
}

async function moveAcrossOffer(page, offerPanel) {
	const box = await offerPanel.boundingBox();
	if (!box) return;
	await page.mouse.move(box.x - 20, box.y - 20);
	const steps = 20;
	for (let step = 0; step <= steps; step += 1) {
		await page.mouse.move(box.x + (box.width * step / steps), box.y + box.height / 2);
		await page.waitForTimeout(50);
	}
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

async function unlockQuote(page, offerPanel, options) {
	const maxAttempts = options.quoteAttempts || 4;
	const checkPrice = page.getByRole('button', { name: /check today.?s price|check again|retry/i }).first();
	let lastState = 'locked';

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		await moveAcrossOffer(page, offerPanel);
		await page.waitForTimeout(options.hoverSettleMs || 1000);
		if (!await checkPrice.isEnabled().catch(() => false)) {
			await page.waitForTimeout(options.quoteRetryDelayMs || 1000);
			continue;
		}
		await checkPrice.click();
		try {
			await page.waitForFunction(() => {
				const panel = document.querySelector('.offer-panel');
				const text = panel?.textContent?.toLowerCase() || '';
				const hasPrice = Boolean(panel?.querySelector('[data-price], .offer-price, [class*="amount"], [class*="price"]')) || /[₹$€£]\s*[\d,]+/.test(text);
				const failed = text.includes('challenge_failed') || text.includes("couldn’t load") || text.includes("couldn't load") || text.includes('retrying');
				return panel && hasPrice && !panel.className.includes('offer-locked') && !text.includes('price locked') && !text.includes('loading') && !failed;
			}, { timeout: options.priceTimeoutMs || 15000 });
			return { unlocked: true, attempts: attempt };
		} catch {
			lastState = (await offerPanel.innerText().catch(() => 'locked')).slice(0, 160);
			if (attempt < maxAttempts) await page.waitForTimeout(options.quoteRetryDelayMs || 1000);
		}
	}

	throw new Error(`INE quote remained locked after ${maxAttempts} attempts: ${lastState}`);
}

export async function scrapeWithBrowser(target, options = {}) {
	const product = typeof target === 'string' ? { url: target } : target;
	const browser = await chromium.launch({ headless: options.headless ?? true, executablePath: options.executablePath || localExecutablePath() });
	try {
		const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
		await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs || 30000 });
		await dismissConsent(page);
		await page.waitForLoadState('networkidle', { timeout: options.networkIdleTimeoutMs || 8000 }).catch(() => {});
		if (options.waitForSelector) await page.waitForSelector(options.waitForSelector, { timeout: 8000 });
		const optionName = product.selectedOption?.name || product.selectedOption?.value || product.selectedOption;
		if (optionName) {
			const option = page.locator('.opt-chip, [data-option]').filter({ hasText: optionName }).first();
			if (await option.count()) await option.click({ timeout: 5000 });
		}
		const offerPanel = page.locator('.offer-panel').first();
		if (await offerPanel.count()) {
			await unlockQuote(page, offerPanel, options);
		} else {
			throw new Error('INE product page did not contain an offer panel');
		}
		await page.waitForTimeout(options.settleMs || 500);
		const html = await page.content();
		return { url: product.url, strategy: 'browser', ...parseProductHtml(html, { selectedOption: product.selectedOption }) };
	} finally {
		await browser.close();
	}
}
