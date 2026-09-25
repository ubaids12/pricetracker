const headers = ['store_product_id', 'product_name', 'selected_option', 'timestamp', 'price', 'stock', 'outcome'];

function csvCell(value) {
  return JSON.stringify(value ?? '');
}

export function toCsv(rows) {
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(','))].join('\n');
}

export function historyRows(products, history, logs) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const attempts = logs.map((log) => {
    const product = productById.get(log.product_id) || {};
    const observation = history.find((item) => item.product_id === log.product_id && item.observed_at === log.finished_at);
    return { store_product_id: product.store_product_id, product_name: product.name, selected_option: log.selected_option || product.selected_option, timestamp: log.finished_at || log.started_at, price: observation?.price, stock: observation?.in_stock, outcome: log.outcome };
  });
  return attempts;
}
