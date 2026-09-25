import { env } from '../config/env.js';
import { fetchWithTimeout } from './fetchWithTimeout.js';
import { parseProductHtml } from './parser.js';

export async function scrapeWithHttp(target, options = {}) {
	const product = typeof target === 'string' ? { url: target } : target;
	const response = await fetchWithTimeout(product.url, { timeoutMs: options.timeoutMs || 12000, headers: { 'User-Agent': 'price-tracker/1.0', Accept: 'text/html' } });
	const html = await response.text();
	return { url: product.url, strategy: 'http', storeBaseUrl: env.storeBaseUrl, ...parseProductHtml(html, { selectedOption: product.selectedOption }) };
}
