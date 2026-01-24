import express from 'express';
import { 
    addDailyStock, 
    getDailyStock, 
    getStockRange, 
    getLowStockVariants, 
    initializeDailyStock 
} from '../controllers/dailyStockController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Daily stock management routes
router.post('/daily-stock/add', authenticateToken, addDailyStock);
router.get('/daily-stock/daily', authenticateToken, getDailyStock);
router.get('/daily-stock/range', authenticateToken, getStockRange);
router.get('/daily-stock/low', authenticateToken, getLowStockVariants);
router.post('/daily-stock/initialize', authenticateToken, initializeDailyStock);

export default router;
