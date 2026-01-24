import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// Helper function to get user by username for authentication
const getUserByUsername = async (username) => {
    const result = await pool.query(
        'SELECT uid, username, full_name, u_role, created_at FROM user_table WHERE username = $1',
        [username]
    );
    return result.rows[0];
};



//login - username only authentication
export const loginUser = async(req,res) => {
    try {
        const { username } = req.body;
        
        if(!username) {
            return res.status(400).json({ error: 'Username is required' });
        };

        // Find user by username using helper function
        const user = await getUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Check if user is active (assuming there's an is_active field, if not, we'll skip this check)
        // For now, we'll assume all users are active since the schema doesn't specify an is_active field
        
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
            'SELECT uid, username, full_name, u_role FROM user_table WHERE uid = $1',
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





