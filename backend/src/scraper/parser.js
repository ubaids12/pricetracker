import * as cheerio from 'cheerio';

import { selectors } from './selectors.js';

const PRICE_PATTERN =
	/(?:[$€£₹]|USD|EUR|GBP)?\s*\d[\d,]*(?:\.\d{1,2})?/i;

function text($, selector) {
	const selected =
		typeof $ === 'function'
			? $(selector)
			: $.find(selector);

	return selected
		.first()
		.text()
		.replace(/\s+/g, ' ')
		.trim();
}

function parsePrice(value) {
	if (typeof value === 'number') {
		return value;
	}

	const match = String(value || '')
		.match(PRICE_PATTERN);

	if (!match) {
		return null;
	}

	const number = Number(
		match[0]
			.replace(/[^\d.]/g, '')
			.replace(
				/(?=\d{3})/g,
				''
			)
	);

	/*
	 * Simpler and safer conversion for values such as:
	 *
	 * ₹11,116
	 * ₹9,449
	 * 78212
	 */

	const cleaned =
		match[0].replace(/[^\d.]/g, '');

	const parsed =
		Number(cleaned);

	return Number.isFinite(parsed)
		? parsed
		: null;
}

function parseStock(value) {
	const normalized =
		String(value || '')
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.trim();

	if (!normalized) {
		return null;
	}

	/*
	 * Examples:
	 *
	 * STOCK: 193 REMAINING
	 * IN STOCK
	 * Available
	 */

	if (
		/stock\s*:\s*\d+\s*remaining/.test(
			normalized
		)
	) {
		return true;
	}

	if (
		/out[ -]?of[ -]?stock/.test(normalized) ||
		/sold[ -]?out/.test(normalized) ||
		/unavailable/.test(normalized) ||
		/not[ -]?available/.test(normalized) ||
		/outofstock/.test(normalized)
	) {
		return false;
	}

	if (
		/in[ -]?stock/.test(normalized) ||
		/available/.test(normalized) ||
		/add to cart/.test(normalized) ||
		/buy now/.test(normalized) ||
		/instock/.test(normalized)
	) {
		return true;
	}

	return null;
}

function parseOfferPanel($) {
	const panel =
		$(selectors.offerPanel).first();

	if (
		!panel.length ||
		panel.hasClass('offer-locked')
	) {
		return {};
	}

	const panelText =
		panel
			.text()
			.replace(/\s+/g, ' ')
			.trim();

	console.log(
		'Parser offer panel text:',
		panelText
	);

	/*
	 * Important:
	 *
	 * Example panel:
	 *
	 * ₹11,116
	 * Member price ₹10,283
	 * ₹9,449
	 * 15% saving
	 * Seller: Northwind Retail
	 * STOCK: 193 REMAINING
	 *
	 * The actual current price is the LAST rupee
	 * amount before the saving information.
	 */

	const priceMatches =
		panelText.match(
			/[₹$€£]\s*[\d,]+(?:\.\d{1,2})?/g
		);

	let price = null;

	if (
		priceMatches &&
		priceMatches.length
	) {
		/*
		 * Usually the last currency value is
		 * the actual selling price.
		 */
		const lastPrice =
			priceMatches[
				priceMatches.length - 1
			];

		price = parsePrice(lastPrice);
	}

	/*
	 * Fallback for pages that don't use a
	 * currency symbol.
	 */
	if (price == null) {
		const numericMatches =
			panelText.match(
				/\b\d[\d,]*(?:\.\d{1,2})?\b/g
			);

		if (
			numericMatches &&
			numericMatches.length
		) {
			/*
			 * Ignore percentage and stock count.
			 * Use the first reasonable product price.
			 */
			const candidates =
				numericMatches
					.map(parsePrice)
					.filter(
						(value) =>
							value != null &&
							value > 100
					);

			if (candidates.length) {
				price =
					candidates[
						candidates.length - 1
					];
			}
		}
	}

	const inStock =
		parseStock(panelText);

	return {
		price,
		inStock
	};
}

function readJsonLd($) {
	const products = [];

	$(
		'script[type="application/ld+json"]'
	).each((_index, element) => {
		try {
			const value =
				JSON.parse(
					$(element).text()
				);

			const entries =
				Array.isArray(value)
					? value
					: [value];

			products.push(
				...entries.flatMap(
					(entry) =>
						entry?.['@type'] ===
						'Product'
							? [entry]
							: []
				)
			);
		} catch {
			// Ignore malformed JSON-LD.
		}
	});

	const product =
		products[0];

	const offer =
		Array.isArray(
			product?.offers
		)
			? product.offers[0]
			: product?.offers;

	return product
		? {
				name:
					product.name ||
					null,

				price:
					parsePrice(
						offer?.price
					),

				inStock:
					parseStock(
						offer?.availability
					)
			}
		: null;
}

export function parseProductHtml(
	html,
	{ selectedOption } = {}
) {
	const $ =
		cheerio.load(html || '');

	const structured =
		readJsonLd($) || {};

	const optionText =
		selectedOption?.name ||
		selectedOption?.value ||
		selectedOption ||
		'';

	let scope =
		$('body');

	if (optionText) {
		const optionNode =
			$(selectors.option)
				.filter(
					(_index, element) =>
						$(element)
							.text()
							.trim() ===
						optionText
				)
				.first();

		if (optionNode.length) {
			scope =
				optionNode
					.closest(
						'[data-option-card], .option-card, li, form'
					)
					.first();
		}
	}

	const priceText =
		scope
			.find(selectors.price)
			.first()
			.attr('data-price') ||
		text(
			scope,
			selectors.price
		) ||
		$('meta[itemprop="price"]')
			.attr('content');

	const stockText =
		scope
			.find(selectors.stock)
			.first()
			.attr('data-stock') ||
		text(
			scope,
			selectors.stock
		) ||
		$('[itemprop="availability"]')
			.attr('content') ||
		text(
			scope,
			selectors.offerPanel
		);

	const offer =
		parseOfferPanel($);

	const price =
		parsePrice(priceText) ??
		offer.price ??
		structured.price;

	const inStock =
		parseStock(stockText) ??
		offer.inStock ??
		structured.inStock;

	console.log(
		'Parser values:'
	);

	console.log({
		priceText,
		stockText,
		offerPrice: offer.price,
		offerStock: offer.inStock,
		finalPrice: price,
		finalStock: inStock
	});

	if (
		price == null ||
		inStock == null
	) {
		throw new Error(
			'Could not extract a complete price and stock result'
		);
	}

	return {
		name:
			structured.name ||
			text(
				$,
				selectors.productName
			) ||
			null,

		price,

		inStock,

		option:
			optionText ||
			null
	};
}