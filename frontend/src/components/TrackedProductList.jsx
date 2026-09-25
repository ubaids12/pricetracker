import ProductCard from './ProductCard';

export default function TrackedProductList({ products = [] }) {
  return <div className="product-list">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
