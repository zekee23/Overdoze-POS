import pool from "../config/db.js";

export const getDashboard = async(req,res) => {
    try {
        // Get admin dashboard data
        const users = await pool.query('SELECT COUNT(*) as total_users FROM user_table');
        const products = await pool.query('SELECT COUNT(*) as total_products FROM products');
        const orders = await pool.query('SELECT COUNT(*) as total_orders FROM orders');
        
        res.json({
            stats: {
                users: users.rows[0].total_users,
                products: products.rows[0].total_products,
                orders: orders.rows[0].total_orders
            },
            user: req.userRole
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPOS = async (req,res) => {
    try {
        // Get POS data for cashiers
        const products = await pool.query(`
            SELECT p.product_id, p.product_name, pv.variant_id, pv.size_label, pv.price 
            FROM products p 
            JOIN product_variants pv ON p.product_id = pv.product_id 
            WHERE p.is_active = true
            ORDER BY p.product_name, pv.size_label
        `);
        
        res.json({
            products: products.rows,
            user: req.userRole
        });
    } catch (error) {
        console.error('POS error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};