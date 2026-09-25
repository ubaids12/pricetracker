const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

export const searchProducts = (query) => apiRequest(`/products/search?q=${encodeURIComponent(query)}`);
export const getTrackedProducts = () => apiRequest('/products/tracked');
export const trackProduct = (productId, selectedOption, selectedOptionId) => apiRequest('/products/tracked', {
  method: 'POST',
  body: JSON.stringify({ productId, selectedOption, selectedOptionId })
});
export const getHistory = (productId) => apiRequest(`/history/${productId}`);
export const getLogs = (productId) => apiRequest(`/logs/${productId}`);
export const exportUrl = (productId) => `${API_BASE_URL}/export/${productId}.csv`;
