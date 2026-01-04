import express from 'express';
import pool from "../config/db.js";
import { registerAdmin, registerUser, loginUser, 
    getCurrentUser, deleteUser, verifyEmail, requestPasswordReset, resetPassword  
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { registrationProtection, adminRegistrationProtection } from '../middleware/arcjet.js';
import { sendOTP, verifyOTPAndRegister} from '../controllers/userController.js';


const router = express.Router();

// Admin registration (for demo setup - protected by Arcjet rate limiting)
router.post('/register-admin', adminRegistrationProtection, registerAdmin);

// Regular user registration (protected by Arcjet rate limiting)
router.post('/register', registrationProtection, registerUser);

// Login (protected by Arcjet rate limiting)
router.post('/login',  loginUser);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

router.post('/create-cashier', authenticateToken, registrationProtection, registerUser);

router.delete('/delete-user/:uid', authenticateToken, requireAdmin, deleteUser);

// Email verification
router.post('/verify-email', verifyEmail);
router.post('/send-otp', sendOTP);
router.post('/verify-otp-register', verifyOTPAndRegister)
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
export default router;