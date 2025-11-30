import express from 'express';
import { getDashboard, getPOS } from '../controllers/dashboardcontroller.js';
import { authenticateToken, requireAdmin, requireCashier } from '../middleware/auth.js';

const router = express.Router();

// Admin dashboard
router.get('/dashboard', authenticateToken, requireAdmin, getDashboard);

// POS system for cashiers and admins
router.get('/pos', authenticateToken, requireCashier, getPOS);

export default router;