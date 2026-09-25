export function successResult({ price, inStock, option }) {
  if (price == null || inStock == null) throw new Error('Scrape result is incomplete');
  return { price, inStock, option, outcome: 'success', error: null };
}

export function failedResult(error) {
  return { price: null, inStock: null, option: null, outcome: 'failed', error: error.message };
}
