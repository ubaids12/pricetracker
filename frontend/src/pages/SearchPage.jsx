import ProductSearchBar from '../components/ProductSearchBar';

export default function SearchPage() {
  return (
    <main className="page-shell">
      <p className="eyebrow">Price intelligence</p>
      <h1>Track the prices that matter.</h1>
      <p className="lede">Search the mock catalog to choose a product and begin collecting reliable price history.</p>
      <ProductSearchBar />
    </main>
  );
}
