import express from 'express';
import { 
    updateVariantUsage, 
    getDailyVariantUsage, 
    getVariantUsageRange, 
    getTopUsedVariants 
} from '../controllers/variantUsageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Variant usage tracking routes
router.post('/variant-usage/update', authenticateToken, updateVariantUsage);
router.get('/variant-usage/daily', authenticateToken, getDailyVariantUsage);
router.get('/variant-usage/range', authenticateToken, getVariantUsageRange);
router.get('/variant-usage/top', authenticateToken, getTopUsedVariants);

export default router;
