import PriceHistoryChart from '../components/PriceHistoryChart';
import ScrapeLogTable from '../components/ScrapeLogTable';
import ExportButton from '../components/ExportButton';

export default function ProductDetail({ product, history, logs, onBack }) {
  return <section className="detail-section"><button type="button" className="button-muted" onClick={onBack}>← Back to dashboard</button><div className="detail-heading"><div><p className="eyebrow">Tracked option</p><h2>{product.name}</h2><p>{product.selected_option} · SKU {product.store_product_id}</p></div><ExportButton productId={product.id} /></div><PriceHistoryChart history={history} /><ScrapeLogTable logs={logs} /></section>;
}
