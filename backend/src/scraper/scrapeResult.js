export function successResult({ price, inStock, option }) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || typeof inStock !== 'boolean' || typeof option !== 'string' || !option.trim()) throw new Error('Scrape result is invalid or incomplete');
  return { price, inStock, option, outcome: 'success', error: null };
}

export function failedResult(error) {
  return { price: null, inStock: null, option: null, outcome: 'failed', error: error.message };
}
