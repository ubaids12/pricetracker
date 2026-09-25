export default function PriceHistoryChart({ history = [] }) {
  const prices = history.filter((item) => item.price != null);
  return <div className="data-panel"><div className="panel-title"><h3>Price and stock history</h3><span>{prices.length} observations</span></div>{prices.length ? <div className="history-list">{prices.map((item) => <div className="history-row" key={item.id}><time>{new Date(item.observed_at).toLocaleString()}</time><strong>{item.price}</strong><span className={item.in_stock ? 'stock-good' : 'stock-out'}>{item.in_stock ? 'In stock' : 'Sold out'}</span></div>)}</div> : <p className="empty-state">No successful observations yet.</p>}</div>;
}
