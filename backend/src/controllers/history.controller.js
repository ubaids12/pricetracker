import { listHistory } from '../db/repositories/priceHistory.repository.js';

export async function getHistory(request, response, next) {
	try { response.json({ data: await listHistory(request.params.productId) }); } catch (error) { next(error); }
}
