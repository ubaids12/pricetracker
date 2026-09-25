export default function ProductCard({ product }) {
  return <article className="product-card"><h3>{product?.name || 'Product name'}</h3><p>{product?.store || 'Store'} · {product?.price || 'No price yet'}</p></article>;
}
