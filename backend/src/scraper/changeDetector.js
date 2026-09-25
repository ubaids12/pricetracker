import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';

export function structureFingerprint(html, selectors) {
	const $ = cheerio.load(html || '');
	const shape = selectors.map((selector) => ({ selector, count: $(selector).length, tags: $(selector).map((_index, element) => element.tagName).get().slice(0, 10) }));
	return createHash('sha256').update(JSON.stringify(shape)).digest('hex');
}

export function detectStructureChange(html, selectors, previousFingerprint) {
	if (!previousFingerprint) return false;
	return structureFingerprint(html, selectors) !== previousFingerprint;
}
