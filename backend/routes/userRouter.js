import express from 'express';
import pool from "../config/db.js";
import { loginUser, getCurrentUser, deleteUser } from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { registrationProtection, adminRegistrationProtection } from '../middleware/arcjet.js';


const router = express.Router();

// Login (username-only authentication)
router.post('/login', loginUser);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

// User management (admin only)
router.delete('/delete-user/:uid', authenticateToken, requireAdmin, deleteUser);

export default router;