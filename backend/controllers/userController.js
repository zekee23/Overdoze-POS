import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

//register
export const registerUser = async(req,res) =>
{
    try {
        const { username, email, pin, full_name, u_role = 'cashier' } = req.body;
        
        // Check if admin exists first
       if (u_role === 'admin') {
    const adminCheck = await pool.query('SELECT * FROM user_table WHERE u_role = $1', ['admin']);
    if (adminCheck.rows.length > 0) {
        return res.status(403).json({ error: 'Admin already exists' });
    }
}
        
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
        
        res.status(201).json({ sucess: true, data:{user: result.rows[0]} });
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