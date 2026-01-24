import express from 'express';
import { syncStockFromOrderItems, getStockVsOrdersComparison } from '../controllers/stockSyncController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/stock-sync/sync - Sync stock from order items for a date
router.get('/sync', syncStockFromOrderItems);

// GET /api/stock-sync/comparison - Compare stock records with actual orders
router.get('/comparison', getStockVsOrdersComparison);

export default router;
