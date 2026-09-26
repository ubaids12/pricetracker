export default function PriceHistoryChart({ history = [] }) {
  const prices = history
    .filter((item) => item.price != null)
    .sort(
      (a, b) =>
        new Date(a.observed_at).getTime() -
        new Date(b.observed_at).getTime()
    );

  if (!prices.length) {
    return (
      <div className="data-panel">
        <div className="panel-title">
          <h3>Price and stock history</h3>
          <span>0 observations</span>
        </div>

        <p className="empty-state">
          No successful observations yet.
        </p>
      </div>
    );
  }

  const width = 800;
  const height = 300;
  const padding = 50;

  const values = prices.map((item) => Number(item.price));

  const minPrice = Math.min(...values);
  const maxPrice = Math.max(...values);

  const priceRange = maxPrice - minPrice || 1;

  const getX = (index) => {
    if (prices.length === 1) {
      return width / 2;
    }

    return (
      padding +
      (index * (width - padding * 2)) / (prices.length - 1)
    );
  };

  const getY = (price) => {
    return (
      height -
      padding -
      ((price - minPrice) / priceRange) *
        (height - padding * 2)
    );
  };

  const points = prices
    .map((item, index) => {
      return `${getX(index)},${getY(Number(item.price))}`;
    })
    .join(' ');

  return (
    <div className="data-panel">
      <div className="panel-title">
        <h3>Price and stock history</h3>
        <span>{prices.length} observations</span>
      </div>

      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          padding: '20px 0'
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="300"
          role="img"
          aria-label="Price history graph"
        >
          {/* Horizontal guide lines */}
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#ddd"
          />

          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#ddd"
          />

          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#ddd"
          />

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#888"
          />

          {/* X-axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#888"
          />

          {/* Price labels */}
          <text
            x="5"
            y={padding + 5}
            fontSize="12"
          >
            ₹{maxPrice.toLocaleString()}
          </text>

          <text
            x="5"
            y={height / 2 + 5}
            fontSize="12"
          >
            ₹
            {(
              minPrice +
              priceRange / 2
            ).toLocaleString()}
          </text>

          <text
            x="5"
            y={height - padding + 5}
            fontSize="12"
          >
            ₹{minPrice.toLocaleString()}
          </text>

          {/* Price line */}
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />

          {/* Data points */}
          {prices.map((item, index) => {
            const x = getX(index);
            const y = getY(Number(item.price));

            return (
              <g key={item.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="currentColor"
                >
                  <title>
                    ₹{Number(item.price).toLocaleString()} —{' '}
                    {new Date(
                      item.observed_at
                    ).toLocaleString()}
                    {' — '}
                    {item.in_stock
                      ? 'In stock'
                      : 'Sold out'}
                  </title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Observation list */}
      <div className="history-list">
        {prices
          .slice()
          .reverse()
          .map((item) => (
            <div
              className="history-row"
              key={item.id}
            >
              <time>
                {new Date(
                  item.observed_at
                ).toLocaleString()}
              </time>

              <strong>
                ₹{Number(item.price).toLocaleString()}
              </strong>

              <span
                className={
                  item.in_stock
                    ? 'stock-good'
                    : 'stock-out'
                }
              >
                {item.in_stock
                  ? 'In stock'
                  : 'Sold out'}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}