import { Router } from 'express';
import { runScrape } from '../controllers/scrape.controller.js';
import { requireCronSecret } from '../middleware/auth.js';

const router = Router();
router.post('/run', requireCronSecret, runScrape);
export default router;
