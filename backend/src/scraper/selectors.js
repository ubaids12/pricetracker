export const selectors = {
  productCard: '[data-product-id], .product-card, article',
  productName: '[data-product-name], .product-name, h1, h2, h3',
  option: '[data-option], select option, .option',
  price: '[data-price], .price, .offer-price, .offer-panel [class*="amount"], .offer-panel [class*="value"]',
  stock: '[data-stock], .stock, .offer-stock, [class*="stock"]',
  editionButton: '.opt-chip',
  offerPanel: '.offer-panel'
};
