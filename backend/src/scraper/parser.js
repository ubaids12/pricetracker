import * as cheerio from 'cheerio';
import { selectors } from './selectors.js';

const PRICE_PATTERN = /(?:[$€£]|USD|EUR|GBP)?\s*\d[\d,]*(?:\.\d{1,2})?/i;

function text($, selector) {
	const selected = typeof $ === 'function' ? $(selector) : $.find(selector);
	return selected.first().text().replace(/\s+/g, ' ').trim();
}

function parsePrice(value) {
	if (typeof value === 'number') return value;
	const match = String(value || '').match(PRICE_PATTERN);
	if (!match) return null;
	const number = Number(match[0].replace(/[^\d.]/g, '').replace(/,(?=\d{3})/g, ''));
	return Number.isFinite(number) ? number : null;
}

function parseStock(value) {
	const normalized = String(value || '').toLowerCase();
	if (!normalized) return null;
	if (/out[ -]?of[ -]?stock|sold[ -]?out|unavailable|not[ -]?available|outofstock/.test(normalized)) return false;
	if (/in[ -]?stock|available|add to cart|buy now|instock/.test(normalized)) return true;
	return null;
}

function parseOfferPanel($) {
	const panel = $(selectors.offerPanel).first();
	if (!panel.length || panel.hasClass('offer-locked')) return {};
	const panelText = panel.text().replace(/\s+/g, ' ').trim();
	const price = parsePrice(panelText);
	const inStock = parseStock(panelText);
	return { price, inStock };
}

function readJsonLd($) {
	const products = [];
	$('script[type="application/ld+json"]').each((_index, element) => {
		try {
			const value = JSON.parse($(element).text());
			const entries = Array.isArray(value) ? value : [value];
			products.push(...entries.flatMap((entry) => entry?.['@type'] === 'Product' ? [entry] : []));
		} catch {
			// Ignore malformed structured data and continue with visible content.
		}
	});
	const product = products[0];
	const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
	return product ? { name: product.name || null, price: parsePrice(offer?.price), inStock: parseStock(offer?.availability) } : null;
}

export function parseProductHtml(html, { selectedOption } = {}) {
	const $ = cheerio.load(html || '');
	const structured = readJsonLd($) || {};
	const optionText = selectedOption?.name || selectedOption?.value || selectedOption || '';
	let scope = $('body');
	if (optionText) {
		const optionNode = $(selectors.option).filter((_index, element) => $(element).text().trim() === optionText).first();
		if (optionNode.length) scope = optionNode.closest('[data-option-card], .option-card, li, form').first();
	}
	const priceText = scope.find(selectors.price).first().attr('data-price') || text(scope, selectors.price) || $('meta[itemprop="price"]').attr('content');
	const stockText = scope.find(selectors.stock).first().attr('data-stock') || text(scope, selectors.stock) || $('[itemprop="availability"]').attr('content') || text(scope, selectors.offerPanel);
	const offer = parseOfferPanel($);
	const price = parsePrice(priceText) ?? offer.price ?? structured.price;
	const inStock = parseStock(stockText) ?? offer.inStock ?? structured.inStock;
	if (price == null || inStock == null) throw new Error('Could not extract a complete price and stock result');
	return { name: structured.name || text($, selectors.productName) || null, price, inStock, option: optionText || null };
}
