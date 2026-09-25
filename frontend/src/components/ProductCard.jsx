import OptionSelector from './OptionSelector';

export default function ProductCard({ product, selectedOption, onOptionChange, onTrack, tracking }) {
  return <article className="product-card">
    <div className="product-heading"><div><p className="card-kicker">{product.store} · {product.sku}</p><h3>{product.name}</h3></div><span className="product-id">#{product.id}</span></div>
    <OptionSelector options={product.options} value={selectedOption} onChange={onOptionChange} />
    <button type="button" disabled={!selectedOption || tracking} onClick={onTrack}>{tracking ? 'Tracking...' : 'Track this option'}</button>
  </article>;
}
