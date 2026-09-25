import ProductCard from './ProductCard';

export default function TrackedProductList({ products = [], onSelect }) {
  return <div className="product-list">{products.map((product) => <button className="tracked-row" type="button" key={product.id} onClick={() => onSelect(product)}><span><strong>{product.name}</strong><small>{product.store_product_id} · {product.selected_option}</small></span><span className="row-arrow">View →</span></button>)}</div>;
}
