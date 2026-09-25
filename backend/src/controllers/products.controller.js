import { createTrackedProduct, listTrackedProducts as listStoredProducts } from '../db/repositories/trackedProducts.repository.js';
import { getProduct, searchCatalog } from '../services/productSearch.service.js';

export async function searchProducts(request, response, next) {
  try { response.json({ data: await searchCatalog(request.query.q || '') }); } catch (error) { next(error); }
}

export async function listTrackedProducts(_request, response, next) {
  try { response.json({ data: await listStoredProducts() }); } catch (error) { next(error); }
}

export async function trackProduct(request, response, next, dependencies = {}) {
  try {
    const findProduct = dependencies.getProduct || getProduct;
    const saveTrackedProduct = dependencies.createTrackedProduct || createTrackedProduct;
    const { productId, selectedOption, selectedOptionId } = request.body;
    if (!productId || !selectedOption) return response.status(400).json({ error: 'productId and selectedOption are required' });
    const product = await findProduct(productId);
    const option = product.options.find((item) => item.name === selectedOption || item.id === selectedOptionId);
    if (!option) return response.status(400).json({ error: 'selectedOption is not available for this product' });
    const tracked = await saveTrackedProduct({ name: product.name, url: product.url, store: 'INE Store', store_product_id: String(product.id), selected_option: option.name, selected_option_id: option.id });
    response.status(201).json({ data: tracked });
  } catch (error) { next(error); }
}
