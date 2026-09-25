export function required(value, field) {
  if (value === undefined || value === null || value === '') throw new Error(`${field} is required`);
  return value;
}

function text(value, field) {
  required(value, field);
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

export function validateTrackedProduct(product) {
  const value = {
    ...product,
    name: text(product.name, 'name'),
    url: text(product.url, 'url'),
    store_product_id: text(product.store_product_id, 'store_product_id'),
    selected_option: text(product.selected_option, 'selected_option')
  };
  try { new URL(value.url); } catch { throw new Error('url must be a valid URL'); }
  if (value.selected_option_id !== undefined && value.selected_option_id !== null && typeof value.selected_option_id !== 'string') throw new Error('selected_option_id must be a string');
  return value;
}

export function validateObservation(observation) {
  required(observation.product_id, 'product_id');
  const selectedOption = text(observation.selected_option, 'selected_option');
  if (typeof observation.price !== 'number' || !Number.isFinite(observation.price) || observation.price < 0) throw new Error('price must be a non-negative number');
  if (typeof observation.in_stock !== 'boolean') throw new Error('in_stock must be boolean');
  return { ...observation, selected_option: selectedOption };
}

export function validateScrapeLog(log) {
  required(log.product_id, 'product_id');
  const selectedOption = text(log.selected_option, 'selected_option');
  if (!Number.isInteger(log.attempt_number) || log.attempt_number < 1) throw new Error('attempt_number must be a positive integer');
  if (!['http', 'browser', 'verification'].includes(log.strategy)) throw new Error('strategy is invalid');
  if (!['success', 'retried', 'failed'].includes(log.outcome)) throw new Error('outcome is invalid');
  for (const field of ['started_at', 'finished_at']) if (log[field] && Number.isNaN(Date.parse(log[field]))) throw new Error(`${field} must be a valid timestamp`);
  return { ...log, selected_option: selectedOption, error_message: log.outcome === 'success' ? null : (log.error_message || 'Scrape did not succeed') };
}
