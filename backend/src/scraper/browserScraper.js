import { chromium } from 'playwright';
import { env } from '../config/env.js';
import { parseProductHtml } from './parser.js';

function localExecutablePath() {
	if (env.browserExecutablePath) {
		return env.browserExecutablePath;
	}

	// Use installed Chrome locally on Windows.
	// On Render/Linux, Playwright will use its bundled Chromium.
	if (process.platform !== 'win32') {
		return undefined;
	}

	return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

async function dismissConsent(page) {
	console.log('Checking for consent dialog...');

	const dialog = page.locator('[role="dialog"], .consent-box').first();

	if (!await dialog.count()) {
		console.log('No consent dialog found');
		return;
	}

	const action = dialog
		.getByRole('button', {
			name: /allow|accept|agree|continue|necessary|reject/i
		})
		.first();

	if (await action.count()) {
		console.log('Consent dialog found. Clicking action...');

		await action
			.click({ timeout: 3000 })
			.catch(() => {
				console.log('Could not click consent button');
			});
	}
}

async function moveAcrossOffer(page, offerPanel) {
	const box = await offerPanel.boundingBox();

	if (!box) {
		console.log('Offer panel has no bounding box');
		return;
	}

	await page.mouse.move(box.x - 20, box.y - 20);

	const steps = 20;

	for (let step = 0; step <= steps; step += 1) {
		await page.mouse.move(
			box.x + (box.width * step / steps),
			box.y + box.height / 2
		);

		await page.waitForTimeout(50);
	}

	await page.mouse.move(
		box.x + box.width / 2,
		box.y + box.height / 2
	);
}

async function unlockQuote(page, offerPanel, options) {
	const maxAttempts = options.quoteAttempts || 4;

	const checkPrice = page
		.getByRole('button', {
			name: /check today.?s price|check again|retry/i
		})
		.first();

	let lastState = 'locked';

	console.log(`Quote unlock attempts allowed: ${maxAttempts}`);

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		console.log(`Quote unlock attempt ${attempt}/${maxAttempts}`);

		await moveAcrossOffer(page, offerPanel);

		await page.waitForTimeout(
			options.hoverSettleMs || 1000
		);

		const enabled = await checkPrice
			.isEnabled()
			.catch(() => false);

		console.log(`Check price button enabled: ${enabled}`);

		if (!enabled) {
			console.log('Check price button is disabled');

			await page.waitForTimeout(
				options.quoteRetryDelayMs || 1000
			);

			continue;
		}

		console.log('Clicking check price button...');

		await checkPrice.click();

		try {
			await page.waitForFunction(
				() => {
					const panel = document.querySelector('.offer-panel');

					const text =
						panel?.textContent?.toLowerCase() || '';

					const hasPrice =
						Boolean(
							panel?.querySelector(
								'[data-price], .offer-price, [class*="amount"], [class*="price"]'
							)
						) ||
						/[$€£₹]\s*[\d,]+/.test(text);

					const failed =
						text.includes('challenge_failed') ||
						text.includes('couldn’t load') ||
						text.includes("couldn't load") ||
						text.includes('retrying');

					return (
						panel &&
						hasPrice &&
						!panel.className.includes('offer-locked') &&
						!text.includes('price locked') &&
						!text.includes('loading') &&
						!failed
					);
				},
				{
					timeout: options.priceTimeoutMs || 15000
				}
			);

			console.log('Price successfully unlocked');

			return {
				unlocked: true,
				attempts: attempt
			};
		} catch (error) {
			lastState = (
				await offerPanel
					.innerText()
					.catch(() => 'locked')
			).slice(0, 160);

			console.log(
				`Quote attempt ${attempt} failed`
			);

			console.log(
				`Current offer state: ${lastState}`
			);

			if (attempt < maxAttempts) {
				await page.waitForTimeout(
					options.quoteRetryDelayMs || 1000
				);
			}
		}
	}

	throw new Error(
		`INE quote remained locked after ${maxAttempts} attempts: ${lastState}`
	);
}

export async function scrapeWithBrowser(target, options = {}) {
	const product =
		typeof target === 'string'
			? { url: target }
			: target;

	console.log('=================================');
	console.log('BROWSER SCRAPER STARTED');
	console.log('=================================');

	console.log(`Browser URL: ${product.url}`);

	const optionName =
		product.selectedOption?.name ||
		product.selectedOption?.value ||
		product.selectedOption;

	console.log(
		`Selected option: ${optionName || 'none'}`
	);

	const executablePath =
		options.executablePath ||
		localExecutablePath();

	console.log(
		`Platform: ${process.platform}`
	);

	console.log(
		`Executable path: ${executablePath || 'Playwright bundled Chromium'}`
	);

	console.log('Launching Playwright browser...');

	const browser = await chromium.launch({
		headless: options.headless ?? true,
		executablePath
	});

	console.log('Playwright browser launched');

	try {
		const page = await browser.newPage({
			viewport: {
				width: 1440,
				height: 900
			}
		});

		console.log('New browser page created');

		console.log('Opening product page...');

		await page.goto(product.url, {
			waitUntil: 'domcontentloaded',
			timeout: options.timeoutMs || 30000
		});

		console.log('Product page loaded');

		await dismissConsent(page);

		console.log('Waiting for network idle...');

		await page
			.waitForLoadState('networkidle', {
				timeout:
					options.networkIdleTimeoutMs || 8000
			})
			.catch(() => {
				console.log(
					'Network idle timeout reached; continuing'
				);
			});

		if (options.waitForSelector) {
			console.log(
				`Waiting for selector: ${options.waitForSelector}`
			);

			await page.waitForSelector(
				options.waitForSelector,
				{
					timeout: 8000
				}
			);
		}

		if (optionName) {
			console.log(
				`Looking for selected option: ${optionName}`
			);

			const option = page
				.locator('.opt-chip, [data-option]')
				.filter({
					hasText: optionName
				})
				.first();

			if (await option.count()) {
				console.log(
					`Selecting option: ${optionName}`
				);

				await option.click({
					timeout: 5000
				});
			} else {
				console.log(
					`Selected option not found: ${optionName}`
				);
			}
		}

		console.log('Looking for offer panel...');

		const offerPanel =
			page.locator('.offer-panel').first();

		if (await offerPanel.count()) {
			console.log('Offer panel found');

			console.log(
				'Attempting to unlock product price...'
			);

			await unlockQuote(
				page,
				offerPanel,
				options
			);

			console.log(
				'Product price successfully unlocked'
			);
		} else {
			throw new Error(
				'INE product page did not contain an offer panel'
			);
		}

		await page.waitForTimeout(
			options.settleMs || 500
		);

		console.log('Reading final page HTML...');

		const html = await page.content();

		console.log('Parsing product HTML...');

		const parsed = parseProductHtml(
			html,
			{
				selectedOption:
					product.selectedOption
			}
		);

		console.log('Browser scrape result:');
		console.log(parsed);

		console.log('=================================');
		console.log('BROWSER SCRAPER FINISHED');
		console.log('=================================');

		return {
			url: product.url,
			strategy: 'browser',
			...parsed
		};
	} finally {
		console.log('Closing Playwright browser...');

		await browser.close();

		console.log('Playwright browser closed');
	}
}