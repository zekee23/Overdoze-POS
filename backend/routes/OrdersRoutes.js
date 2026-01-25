import express from 'express';
import { createOrder, getOrders, getOrderById, deleteOrdersByMonth, deleteOldOrders, deleteOrderById } from '../controllers/ordersController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/orders',authenticateToken , createOrder);
router.get('/orders', authenticateToken, getOrders);
router.get('/orders/:id', authenticateToken, getOrderById);
router.delete('/orders/:id', authenticateToken, deleteOrderById);
router.delete('/orders/by-month', authenticateToken, deleteOrdersByMonth);
router.delete('/orders/old', authenticateToken, deleteOldOrders);

export default router;
