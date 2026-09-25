import { listTrackedProducts } from '../db/repositories/trackedProducts.repository.js';
import { listHistory } from '../db/repositories/priceHistory.repository.js';
import { listScrapeLogs } from '../db/repositories/scrapeLogs.repository.js';
import { historyRows, toCsv } from '../services/csvExport.service.js';

export async function exportHistory(request, response, next) {
	try {
		const products = await listTrackedProducts();
		const product = products.filter((item) => item.id === request.params.productId);
		const history = await listHistory(request.params.productId);
		const logs = await listScrapeLogs(request.params.productId);
		response.type('text/csv').send(toCsv(historyRows(product, history, logs)));
	} catch (error) { next(error); }
}
