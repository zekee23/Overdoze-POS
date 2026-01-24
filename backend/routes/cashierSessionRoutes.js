import express from 'express';
import { 
    openCashierSession, 
    getActiveCashierSession, 
    closeCashierSession, 
    getDailyCashierSessions, 
    getSessionSales 
} from '../controllers/cashierSessionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Cashier session management routes
router.post('/cashier-sessions/open', authenticateToken, openCashierSession);
router.get('/cashier-sessions/active/:cashier_id', authenticateToken, getActiveCashierSession);
router.put('/cashier-sessions/close/:session_id', authenticateToken, closeCashierSession);
router.get('/cashier-sessions/daily', authenticateToken, getDailyCashierSessions);
router.get('/cashier-sessions/:session_id/sales', authenticateToken, getSessionSales);

export default router;
