import TrackedProductList from '../components/TrackedProductList';

export default function Dashboard({ products, onSelect, onRefresh }) {
  return <section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Your watchlist</p><h2>Tracked products</h2></div><button type="button" className="button-muted" onClick={onRefresh}>Refresh</button></div>{products.length ? <TrackedProductList products={products} onSelect={onSelect} /> : <p className="empty-state">No products tracked yet.</p>}</section>;
}
