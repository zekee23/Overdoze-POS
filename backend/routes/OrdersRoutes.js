import express from 'express';
import { createOrder, getOrders, getOrderById } from '../controllers/ordersController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/orders',authenticateToken , createOrder);
router.get('/orders', authenticateToken, getOrders);
router.get('/orders/:id', authenticateToken, getOrderById);

export default router;
