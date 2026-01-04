import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { generateOTP, sendOTPEmail, storeOTP, verifyOTP, sendPasswordResetEmail } from "../services/emailService.js";

//register admin (for demo setup only)
export const registerAdmin = async(req,res) =>
{
    try {
        const { username, email, pin, full_name } = req.body;
        
        // Force role to be admin
        const u_role = 'admin';
        
        // Check if admin already exists
        const adminCheck = await pool.query('SELECT * FROM user_table WHERE u_role = $1', ['admin']);
        if (adminCheck.rows.length > 0) {
            return res.status(403).json({ error: 'Admin already exists' });
        }
        
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM user_table WHERE email = $1 OR username = $2 OR full_name =$3',
            [email, username, full_name]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash pin
        const hashedPin = await bcrypt.hash(pin, 10);
        
        // Create admin user
        const result = await pool.query(
            'INSERT INTO user_table (username, email, pin_hash, full_name, u_role) VALUES ($1, $2, $3, $4, $5) RETURNING uid, username, email, full_name, u_role',
            [username, email, hashedPin, full_name, u_role]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Admin user created successfully',
            data: {user: result.rows[0]} 
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

//register
export const registerUser = async(req,res) =>
{
    try {
        const { username, email, pin, full_name } = req.body;
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        const u_role = 'cashier'; // Default role for regular users
        
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM user_table WHERE email = $1 OR username = $2 OR full_name =$3',
            [email, username,full_name]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash pin
        const hashedPin = await bcrypt.hash(pin, 10);
        
        // Create user
        const result = await pool.query(
            'INSERT INTO user_table (username, email, pin_hash, full_name, u_role) VALUES ($1, $2, $3, $4, $5) RETURNING uid, username, email, full_name, u_role',
            [username, email, hashedPin, full_name, u_role]
        );
        
        res.status(201).json({ success: true, data:{user: result.rows[0]} });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

//login
export const loginUser = async(req,res) => {
    try {
        const { username, pin } = req.body;
        
        if(!username || !pin) {
            return res.status(400).json({ error: 'Username and pin are required' });
        };

        // Find user
        const result = await pool.query(
            'SELECT * FROM user_table WHERE username = $1 OR email = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        
        // Check pin
        const isValidPin = await bcrypt.compare(pin, user.pin_hash);
        
        if (!isValidPin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.uid, username: user.username, role: user.u_role },
            process.env.JWT_SECRET || 'a85a97af3d3ed4d5919992a12fc44c74',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                uid: user.uid,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                u_role: user.u_role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//get current user
export const getCurrentUser = async(req,res) => {
    try {
        const result = await pool.query(
            'SELECT uid, username, email, full_name, u_role FROM user_table WHERE uid = $1',
            [req.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async(req,res) => {
    try {
        const uid = req.params.uid;

        const udelete = await pool.query(
            'DELETE FROM user_table WHERE uid = $1 RETURNING uid',
            [uid]

        )
        if (udelete.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
        
    }
};

// Verify email
export const verifyEmail = async(req, res) => {
    try {
        const { email } = req.body;
        
        const result = await pool.query(
            'UPDATE user_table SET email_verified = true WHERE email = $1 RETURNING uid, username, email, email_verified',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Email verified successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Send OTP for email verification
export const sendOTP = async(req, res) => {
    try {
        const { email } = req.body;
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM user_table WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Generate and send OTP
        const otp = generateOTP();
        const emailSent = await sendOTPEmail(email, otp);
        
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send OTP email' });
        }
        
        // Store OTP
        storeOTP(email, otp);
        
        res.json({ 
            success: true, 
            message: 'OTP sent to your email. Please check your inbox.',
            email: email
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Verify OTP and complete registration
export const verifyOTPAndRegister = async(req, res) => {
    try {
        const { email, otp, username, pin, full_name } = req.body;
        
        // Verify OTP
        const otpVerification = verifyOTP(email, otp);
        
        if (!otpVerification.valid) {
            return res.status(400).json({ error: otpVerification.message });
        }
        
        const u_role = 'cashier'; // Default role for regular users
        
        // Check if user already exists (double check)
        const existingUser = await pool.query(
            'SELECT * FROM user_table WHERE email = $1 OR username = $2 OR full_name =$3',
            [email, username, full_name]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash pin
        const hashedPin = await bcrypt.hash(pin, 10);
        
        // Create user with email_verified set to true
        const result = await pool.query(
            'INSERT INTO user_table (username, email, pin_hash, full_name, u_role, email_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING uid, username, email, full_name, u_role, email_verified',
            [username, email, hashedPin, full_name, u_role, true]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Registration successful! You can now login.',
            data: { user: result.rows[0] }
        });
    } catch (error) {
        console.error('Verify OTP and register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Request password reset
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user exists
        const user = await pool.query(
            'SELECT * FROM user_table WHERE email = $1',
            [email]
        );
        
        if (user.rows.length === 0) {
            // Don't reveal if email exists for security
            return res.json({ 
                success: true, 
                message: 'If an account exists with this email, a password reset link has been sent.' 
            });
        }
        
        // Generate token with user ID and purpose
        const resetToken = jwt.sign(
            { 
                userId: user.rows[0].uid,
                purpose: 'password_reset',
                // Add a random value to make each token unique
                rnd: Math.random().toString(36).substring(2, 15)
            },
            process.env.JWT_SECRET || 'a85a97af3d3ed4d5919992a12fc44c74',
            { expiresIn: '15m' } // Token expires in 15 minutes
        );
        
        // Send password reset email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(email, resetLink);
        
        res.json({ 
            success: true, 
            message: 'If an account exists with this email, a password reset link has been sent.' 
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Reset password with token
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'a85a97af3d3ed4d5919992a12fc44c74');
        
        // Check if token is for password reset
        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ 
                error: 'Invalid reset token' 
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await pool.query(
            'UPDATE user_table SET pin_hash = $1 WHERE uid = $2',
            [hashedPassword, decoded.userId]
        );
        
        res.json({ 
            success: true, 
            message: 'Password has been reset successfully. You can now login with your new password.' 
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ 
                error: 'Reset link has expired. Please request a new one.' 
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ 
                error: 'Invalid reset token' 
            });
        }
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};