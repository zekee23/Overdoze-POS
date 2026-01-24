import express from 'express';
import { setStartingCash, getTodayStartingCash, getExpectedCashInDrawer } from '../controllers/cashDrawerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Set starting cash for today (once per day)
router.post('/starting-cash', setStartingCash);

// Get today's starting cash
router.get('/starting-cash', getTodayStartingCash);

// Get expected cash in drawer calculation
router.get('/expected-cash', getExpectedCashInDrawer);

export default router;
