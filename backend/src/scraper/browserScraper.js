import { chromium } from 'playwright';
import { env } from '../config/env.js';
import { parseProductHtml } from './parser.js';

function localExecutablePath() {
	if (env.browserExecutablePath) {
		return env.browserExecutablePath;
	}

	// Use installed Chrome locally on Windows.
	// On Render/Linux, Playwright will use bundled Chromium.
	if (process.platform !== 'win32') {
		return undefined;
	}

	return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

/* =========================================================
   COOKIE / CONSENT HANDLING
   ========================================================= */

async function dismissConsent(page) {
	console.log('Checking for consent dialog...');

	console.log(
		'Consent scrim count:',
		await page.locator('.consent-scrim').count()
	);

	console.log(
		'Consent buttons:',
		await page.locator('.consent-scrim button').allTextContents()
	);

	// Look for common consent/dialog containers
	const dialog = page
		.locator(
			'[role="dialog"], .consent-box, .consent-modal, .cookie-banner, .cookie-modal'
		)
		.first();

	// Also check the scrim itself
	const scrim = page.locator('.consent-scrim').first();

	if (!(await dialog.count()) && !(await scrim.count())) {
		console.log('No consent dialog found');
		return;
	}

	console.log('Consent element found');

	// Try to find an accept/allow/agree button
	const action = page
		.getByRole('button', {
			name: /accept|accept all|allow|agree|continue|necessary|got it|ok|okay/i
		})
		.first();

	if (await action.count()) {
		console.log('Consent button found');
		console.log(
			'Consent button text:',
			await action.innerText().catch(() => '')
		);

		try {
			await action.click({
				timeout: 5000
			});

			console.log('Consent button clicked');
		} catch (error) {
			console.log(
				'Normal consent click failed:',
				error.message
			);

			// Try clicking with force only for the consent button itself
			try {
				await action.click({
					timeout: 5000,
					force: true
				});

				console.log('Consent button force-clicked');
			} catch (forceError) {
				console.log(
					'Could not click consent button:',
					forceError.message
				);
			}
		}
	} else {
		console.log('No consent button found');
	}

	// Give the popup time to disappear
	await page.waitForTimeout(500);

	// Wait for scrim to disappear
	const currentScrim = page.locator('.consent-scrim');

	if (await currentScrim.count()) {
		try {
			await currentScrim.first().waitFor({
				state: 'hidden',
				timeout: 3000
			});

			console.log('Consent scrim disappeared');
		} catch {
			console.log(
				'Consent scrim is still visible'
			);
		}
	}

	// Final diagnostic
	console.log(
		'Consent scrim count after handling:',
		await page.locator('.consent-scrim').count()
	);
}

/* =========================================================
   MOVE ACROSS OFFER PANEL
   ========================================================= */

async function moveAcrossOffer(page, offerPanel) {
	const box = await offerPanel.boundingBox();

	if (!box) {
		console.log(
			'Offer panel has no bounding box'
		);
		return;
	}

	await page.mouse.move(
		box.x - 20,
		box.y - 20
	);

	const steps = 20;

	for (
		let step = 0;
		step <= steps;
		step += 1
	) {
		await page.mouse.move(
			box.x +
				(box.width * step) /
					steps,
			box.y +
				box.height / 2
		);

		await page.waitForTimeout(50);
	}

	await page.mouse.move(
		box.x + box.width / 2,
		box.y + box.height / 2
	);
}

/* =========================================================
   UNLOCK PRICE
   ========================================================= */

async function unlockQuote(
	page,
	offerPanel,
	options
) {
	const maxAttempts =
		options.quoteAttempts || 4;

	const checkPrice = page
		.getByRole('button', {
			name: /check today.?s price|check again|retry/i
		})
		.first();

	let lastState = 'locked';

	console.log(
		`Quote unlock attempts allowed: ${maxAttempts}`
	);

	for (
		let attempt = 1;
		attempt <= maxAttempts;
		attempt += 1
	) {
		console.log(
			`Quote unlock attempt ${attempt}/${maxAttempts}`
		);

		/*
		 * Check cookie overlay again before every attempt.
		 */
		const consentScrim =
			page.locator('.consent-scrim');

		if (await consentScrim.count()) {
			console.log(
				'Consent scrim detected before price click'
			);

			await dismissConsent(page);
		}

		await moveAcrossOffer(
			page,
			offerPanel
		);

		await page.waitForTimeout(
			options.hoverSettleMs || 1000
		);

		const enabled =
			await checkPrice
				.isEnabled()
				.catch(() => false);

		console.log(
			`Check price button enabled: ${enabled}`
		);

		if (!enabled) {
			console.log(
				'Check price button is disabled'
			);

			await page.waitForTimeout(
				options.quoteRetryDelayMs || 1000
			);

			continue;
		}

		/*
		 * Make sure consent overlay is gone
		 * immediately before clicking.
		 */
		if (
			await page
				.locator('.consent-scrim')
				.count()
		) {
			console.log(
				'Consent overlay still present. Handling again...'
			);

			await dismissConsent(page);
		}

		console.log(
			'Clicking check price button...'
		);

		try {
			await checkPrice.click({
				timeout: 10000
			});
		} catch (error) {
			console.log(
				'Normal price button click failed:',
				error.message
			);

			/*
			 * Do NOT blindly force-click the price button.
			 * First verify whether the consent overlay
			 * is blocking it.
			 */
			const blockingScrim =
				page.locator('.consent-scrim');

			if (await blockingScrim.count()) {
				console.log(
					'Consent scrim is blocking the price button'
				);

				await dismissConsent(page);

				// Try normal click again
				await checkPrice.click({
					timeout: 10000
				});
			} else {
				throw error;
			}
		}

		try {
			await page.waitForFunction(
				() => {
					const panel =
						document.querySelector(
							'.offer-panel'
						);

					const text =
						panel?.textContent
							?.toLowerCase() || '';

					const hasPrice =
						Boolean(
							panel?.querySelector(
								'[data-price], .offer-price, [class*="amount"], [class*="price"]'
							)
						) ||
						/[$€£₹]\s*[\d,]+/.test(
							text
						);

					const failed =
						text.includes(
							'challenge_failed'
						) ||
						text.includes(
							'couldn’t load'
						) ||
						text.includes(
							"couldn't load"
						) ||
						text.includes(
							'retrying'
						);

					return (
						panel &&
						hasPrice &&
						!panel.className.includes(
							'offer-locked'
						) &&
						!text.includes(
							'price locked'
						) &&
						!text.includes(
							'loading'
						) &&
						!failed
					);
				},
				{
					timeout:
						options.priceTimeoutMs ||
						15000
				}
			);

			console.log(
				'Price successfully unlocked'
			);

			console.log(
				'Offer panel count after price unlock:',
				await page
					.locator('.offer-panel')
					.count()
			);

			console.log(
				'Offer panel text:',
				await page
					.locator('.offer-panel')
					.first()
					.innerText()
					.catch(() => '')
			);

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

			if (
				attempt < maxAttempts
			) {
				await page.waitForTimeout(
					options.quoteRetryDelayMs ||
						1000
				);
			}
		}
	}

	throw new Error(
		`INE quote remained locked after ${maxAttempts} attempts: ${lastState}`
	);
}

/* =========================================================
   MAIN BROWSER SCRAPER
   ========================================================= */

export async function scrapeWithBrowser(
	target,
	options = {}
) {
	const product =
		typeof target === 'string'
			? { url: target }
			: target;

	console.log(
		'================================='
	);
	console.log(
		'BROWSER SCRAPER STARTED'
	);
	console.log(
		'================================='
	);

	console.log(
		`Browser URL: ${product.url}`
	);

	const optionName =
		product.selectedOption?.name ||
		product.selectedOption?.value ||
		product.selectedOption;

	console.log(
		`Selected option: ${
			optionName || 'none'
		}`
	);

	const executablePath =
		options.executablePath ||
		localExecutablePath();

	console.log(
		`Platform: ${process.platform}`
	);

	console.log(
		`Executable path: ${
			executablePath ||
			'Playwright bundled Chromium'
		}`
	);

	console.log(
		'Launching Playwright browser...'
	);

	const browser =
		await chromium.launch({
			headless:
				options.headless ?? true,
			executablePath
		});

	console.log(
		'Playwright browser launched'
	);

	try {
		const page =
			await browser.newPage({
				viewport: {
					width: 1440,
					height: 900
				}
			});

		console.log(
			'New browser page created'
		);

		console.log(
			'Opening product page...'
		);

		await page.goto(
			product.url,
			{
				waitUntil:
					'domcontentloaded',
				timeout:
					options.timeoutMs ||
					30000
			}
		);

		console.log(
			'Product page loaded'
		);

		/* =========================================
		   DEBUG COOKIE / CONSENT
		   ========================================= */

		console.log(
			'Page title:',
			await page.title()
		);

		console.log(
			'Initial offer panel count:',
			await page
				.locator('.offer-panel')
				.count()
		);

		console.log(
			'Consent scrim count:',
			await page
				.locator('.consent-scrim')
				.count()
		);

		console.log(
			'Consent buttons:',
			await page
				.locator(
					'.consent-scrim button'
				)
				.allTextContents()
		);

		console.log(
			'Body text preview:',
			(
				await page
					.locator('body')
					.innerText()
			).slice(0, 2000)
		);

		/* =========================================
		   HANDLE COOKIE POPUP
		   ========================================= */

		await dismissConsent(page);

		console.log(
			'Waiting for network idle...'
		);

		await page
			.waitForLoadState(
				'networkidle',
				{
					timeout:
						options.networkIdleTimeoutMs ||
						8000
				}
			)
			.catch(() => {
				console.log(
					'Network idle timeout reached; continuing'
				);
			});

		/* =========================================
		   OPTIONAL SELECTOR
		   ========================================= */

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

		/* =========================================
		   SELECT PRODUCT OPTION
		   ========================================= */

		if (optionName) {
			console.log(
				`Looking for selected option: ${optionName}`
			);

			const option =
				page
					.locator(
						'.opt-chip, [data-option]'
					)
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

				console.log(
					`Option ${optionName} selected`
				);

				await page.waitForTimeout(
					300
				);
			} else {
				console.log(
					`Selected option not found: ${optionName}`
				);
			}
		}

		/* =========================================
		   OFFER PANEL
		   ========================================= */

		console.log(
			'Offer panel count after option selection:',
			await page
				.locator('.offer-panel')
				.count()
		);

		console.log(
			'Body text after option selection:',
			(
				await page
					.locator('body')
					.innerText()
			).slice(0, 2500)
		);

		console.log(
			'Looking for offer panel...'
		);

		const offerPanel =
			page
				.locator('.offer-panel')
				.first();

		if (
			await offerPanel.count()
		) {
			console.log(
				'Offer panel found'
			);

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

		/* =========================================
		   FINAL HTML
		   ========================================= */

		console.log(
			'Reading final page HTML...'
		);

		const html =
			await page.content();

		console.log(
			'Parsing product HTML...'
		);

		const parsed =
			parseProductHtml(
				html,
				{
					selectedOption:
						product.selectedOption
				}
			);

		console.log(
			'Browser scrape result:'
		);

		console.log(parsed);

		console.log(
			'================================='
		);

		console.log(
			'BROWSER SCRAPER FINISHED'
		);

		console.log(
			'================================='
		);

		return {
			url: product.url,
			strategy: 'browser',
			...parsed
		};
	} finally {
		console.log(
			'Closing Playwright browser...'
		);

		await browser.close();

		console.log(
			'Playwright browser closed'
		);
	}
}