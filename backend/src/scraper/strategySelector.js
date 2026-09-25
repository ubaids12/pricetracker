export function selectStrategy(product = {}) {
	if (product.requiresBrowser || product.lastStrategy === 'browser' || product.httpFailures >= 2) return 'browser';
	return 'http';
}
