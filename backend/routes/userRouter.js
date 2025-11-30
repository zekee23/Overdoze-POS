import express from 'express';
import pool from "../config/db.js";
import { registerUser, loginUser, getCurrentUser, deleteUser} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/me', authenticateToken, getCurrentUser);

router.post('/create-cashier', authenticateToken, requireAdmin, registerUser);

router.delete('/delete-user/:uid', authenticateToken, requireAdmin, deleteUser);

export default router;