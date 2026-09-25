import { Router } from 'express';
import { exportHistory } from '../controllers/export.controller.js';
const router = Router();
router.get('/:productId.csv', exportHistory);
export default router;
