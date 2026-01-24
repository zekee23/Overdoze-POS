import express from 'express';
import { 
    getDailyCashReport, 
    getDailyInventoryReport, 
    getDailySummaryReport, 
    getDailyReportRange 
} from '../controllers/dailyReportsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Daily reporting routes
router.get('/reports/daily/cash', authenticateToken, getDailyCashReport);
router.get('/reports/daily/inventory', authenticateToken, getDailyInventoryReport);
router.get('/reports/daily/summary', authenticateToken, getDailySummaryReport);
router.get('/reports/daily/range', authenticateToken, getDailyReportRange);

export default router;
