import { Router } from 'express';
import { searchProducts, listTrackedProducts, trackProduct } from '../controllers/products.controller.js';

const router = Router();
router.get('/search', searchProducts);
router.get('/tracked', listTrackedProducts);
router.post('/tracked', trackProduct);
export default router;
