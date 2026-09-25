import { scrapeProduct } from './scrapeProduct.js';

export async function runHeaded(product) {
	const target = typeof product === 'string' ? { url: product } : product;
	console.log(`Opening ${target.url}`);
	const result = await scrapeProduct(target, { headless: false, browserFallback: true, attempts: 2 });
	console.log(JSON.stringify(result, null, 2));
	return result;
}
