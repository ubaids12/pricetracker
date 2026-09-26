import PriceHistoryChart from '../components/PriceHistoryChart';
import ScrapeLogTable from '../components/ScrapeLogTable';
import ExportButton from '../components/ExportButton';

export default function ProductDetail({
  product,
  history = [],
  logs,
  onBack
}) {
  const prices = history
    .filter(
      (item) =>
        item.price !== null &&
        item.price !== undefined &&
        Number.isFinite(Number(item.price))
    )
    .sort(
      (a, b) =>
        new Date(a.observed_at).getTime() -
        new Date(b.observed_at).getTime()
    );

  const latest = prices[prices.length - 1];
  const previous = prices[prices.length - 2];

  const priceValues = prices.map((item) => Number(item.price));

  const currentPrice = latest ? Number(latest.price) : null;

  const lowestPrice = priceValues.length
    ? Math.min(...priceValues)
    : null;

  const highestPrice = priceValues.length
    ? Math.max(...priceValues)
    : null;

  const averagePrice = priceValues.length
    ? priceValues.reduce((sum, price) => sum + price, 0) /
      priceValues.length
    : null;

  const priceChange =
    latest && previous
      ? currentPrice - Number(previous.price)
      : null;

  const priceChangePercent =
    latest && previous && Number(previous.price) !== 0
      ? (priceChange / Number(previous.price)) * 100
      : null;

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return '—';
    }

    return `₹${price.toLocaleString('en-IN', {
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <section className="detail-section">

      <button
        type="button"
        className="button-muted"
        onClick={onBack}
      >
        ← Back to dashboard
      </button>

      <div className="detail-heading">
        <div>
          <p className="eyebrow">Tracked option</p>
          <h2>{product.name}</h2>
          <p>
            {product.selected_option} · SKU {product.store_product_id}
          </p>
        </div>

        <ExportButton productId={product.id} />
      </div>

      {/* Price Analytics */}
      <div className="data-panel price-overview">

        <div className="panel-title">
          <h3>Price overview</h3>

          <span>
            {prices.length}{' '}
            {prices.length === 1
              ? 'observation'
              : 'observations'}
          </span>
        </div>

        <div className="price-stats">

          <div className="price-stat">
            <p className="eyebrow">Current price</p>
            <strong className="price-stat-value">
              {formatPrice(currentPrice)}
            </strong>
          </div>

          <div className="price-stat">
            <p className="eyebrow">Lowest price</p>
            <strong className="price-stat-value">
              {formatPrice(lowestPrice)}
            </strong>
          </div>

          <div className="price-stat">
            <p className="eyebrow">Highest price</p>
            <strong className="price-stat-value">
              {formatPrice(highestPrice)}
            </strong>
          </div>

          <div className="price-stat">
            <p className="eyebrow">Average price</p>
            <strong className="price-stat-value">
              {formatPrice(averagePrice)}
            </strong>
          </div>

        </div>

        <div className="price-meta">

          {priceChange !== null && (
            <div className="price-meta-item">
              <p className="eyebrow">Since previous observation</p>

              <span
                className={
                  priceChange > 0
                    ? 'price-change price-change-up'
                    : priceChange < 0
                    ? 'price-change price-change-down'
                    : 'price-change'
                }
              >
                {priceChange > 0
                  ? '↑'
                  : priceChange < 0
                  ? '↓'
                  : '→'}{' '}

                {formatPrice(Math.abs(priceChange))}

                {priceChangePercent !== null && (
                  <small>
                    {' '}
                    ({priceChangePercent > 0 ? '+' : ''}
                    {priceChangePercent.toFixed(2)}%)
                  </small>
                )}
              </span>
            </div>
          )}

          {latest && (
            <div className="price-meta-item">
              <p className="eyebrow">Current stock</p>

              <span
                className={
                  latest.in_stock
                    ? 'stock-good'
                    : 'stock-out'
                }
              >
                {latest.in_stock
                  ? 'In stock'
                  : 'Sold out'}
              </span>
            </div>
          )}

          {latest && (
            <div className="price-meta-item">
              <p className="eyebrow">Last observed</p>

              <span className="last-observed">
                {new Date(
                  latest.observed_at
                ).toLocaleString()}
              </span>
            </div>
          )}

        </div>
      </div>

      <PriceHistoryChart history={history} />

      <ScrapeLogTable logs={logs} />

    </section>
  );
}