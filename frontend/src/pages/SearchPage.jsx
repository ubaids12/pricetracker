import ProductSearchBar from '../components/ProductSearchBar';
import ProductCard from '../components/ProductCard';

export default function SearchPage({ onSearch, results, selections, onOptionChange, onTrack, tracking, busy, error }) {
  return (
    <main className="page-shell">
      <p className="eyebrow">Price intelligence</p>
      <h1>Track the prices that matter.</h1>
      <p className="lede">Search the mock catalog to choose a product and begin collecting reliable price history.</p>
      <ProductSearchBar onSearch={onSearch} busy={busy} />
      {error && <p className="error-message">{error}</p>}
      {results.length > 0 && <section className="results-section"><div className="section-heading"><h2>Matching products</h2><span>{results.length} found</span></div><div className="product-grid">{results.map((product) => <ProductCard key={product.id} product={product} selectedOption={selections[product.id]} onOptionChange={(optionId) => onOptionChange(product.id, optionId)} onTrack={() => onTrack(product)} tracking={tracking === product.id} />)}</div></section>}
    </main>
  );
}
