import express from 'express';
import { getPOSData } from '../controllers/posdataController.js';
import { authenticateToken, requireCashier } from '../middleware/auth.js';
import { productsRefreshProtection } from '../middleware/arcjet.js';
import { setStockStatus } from '../controllers/dashboardController/dashboard.queries.js';

const router = express.Router();

router.get('/pos-data', authenticateToken, requireCashier, productsRefreshProtection, getPOSData);
router.post('/set-stock-status/:id', authenticateToken, requireCashier, setStockStatus);

export default router;
