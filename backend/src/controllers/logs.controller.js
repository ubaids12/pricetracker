import { listScrapeLogs } from '../db/repositories/scrapeLogs.repository.js';

export async function getLogs(request, response, next) {
	try { response.json({ data: await listScrapeLogs(request.params.productId) }); } catch (error) { next(error); }
}
