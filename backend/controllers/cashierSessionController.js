import pool from '../config/db.js';

export const openCashierSession = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { cashier_id, starting_cash } = req.body;
        const business_date = new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        if (!cashier_id || !starting_cash || isNaN(starting_cash) || parseFloat(starting_cash) < 0) {
            return res.status(400).json({ error: 'Valid cashier_id and starting_cash are required' });
        }
        
        await client.query('BEGIN');
        
        // Check if cashier exists
        const cashierExists = await client.query(
            'SELECT uid, username FROM user_table WHERE uid = $1 AND u_role = $2',
            [cashier_id, 'cashier']
        );
        
        if (cashierExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Cashier not found or invalid role' });
        }
        
        // Check if session already exists for this cashier today
        const existingSession = await client.query(
            'SELECT session_id FROM cashier_sessions WHERE cashier_id = $1 AND business_date = $2',
            [cashier_id, business_date]
        );
        
        if (existingSession.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Session already exists for this cashier today' });
        }
        
        // Create new session
        const sessionResult = await client.query(
            `INSERT INTO cashier_sessions (cashier_id, business_date, starting_cash, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [cashier_id, business_date, parseFloat(starting_cash), req.userId || cashier_id]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
            success: true,
            session: sessionResult.rows[0],
            cashier: cashierExists.rows[0]
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR opening cashier session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const getActiveCashierSession = async (req, res) => {
    try {
        const { cashier_id } = req.params;
        const business_date = new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        const sessionResult = await pool.query(
            `SELECT cs.*, u.username as cashier_name 
             FROM cashier_sessions cs
             JOIN user_table u ON cs.cashier_id = u.uid
             WHERE cs.cashier_id = $1 AND cs.business_date = $2 AND cs.session_status = 'active'`,
            [cashier_id, business_date]
        );
        
        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ error: 'No active session found for this cashier today' });
        }
        
        res.json({
            success: true,
            session: sessionResult.rows[0]
        });
        
    } catch (error) {
        console.error('ERROR getting active cashier session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const closeCashierSession = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { session_id } = req.params;
        
        await client.query('BEGIN');
        
        // Get session details
        const sessionResult = await client.query(
            'SELECT * FROM cashier_sessions WHERE session_id = $1 AND session_status = $2',
            [session_id, 'active']
        );
        
        if (sessionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Active session not found' });
        }
        
        const session = sessionResult.rows[0];
        
        // Calculate total sales for the session
        const salesResult = await client.query(
            'SELECT COALESCE(SUM(total_amount), 0) as total_sales FROM orders WHERE session_id = $1',
            [session_id]
        );
        
        const totalSales = parseFloat(salesResult.rows[0].total_sales);
        
        // Update session with total sales and close it
        const updateResult = await client.query(
            `UPDATE cashier_sessions 
             SET total_sales = $1, session_status = 'closed', closed_at = CURRENT_TIMESTAMP
             WHERE session_id = $2
             RETURNING *`,
            [totalSales, session_id]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            session: updateResult.rows[0],
            calculated_sales: totalSales,
            ending_cash: session.starting_cash + totalSales
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR closing cashier session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const getDailyCashierSessions = async (req, res) => {
    try {
        const { date } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        const sessionsResult = await pool.query(
            `SELECT cs.*, u.username as cashier_name
             FROM cashier_sessions cs
             JOIN user_table u ON cs.cashier_id = u.uid
             WHERE cs.business_date = $1
             ORDER BY cs.opened_at ASC`,
            [business_date]
        );
        
        res.json({
            success: true,
            business_date: business_date,
            sessions: sessionsResult.rows
        });
        
    } catch (error) {
        console.error('ERROR getting daily cashier sessions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getSessionSales = async (req, res) => {
    try {
        const { session_id } = req.params;
        
        // Verify session exists
        const sessionResult = await pool.query(
            'SELECT * FROM cashier_sessions WHERE session_id = $1',
            [session_id]
        );
        
        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Get orders for this session
        const ordersResult = await pool.query(
            `SELECT o.order_id, o.total_amount, o.created_at, u.username as cashier_name
             FROM orders o
             JOIN user_table u ON o.cashier_id = u.uid
             WHERE o.session_id = $1
             ORDER BY o.created_at ASC`,
            [session_id]
        );
        
        // Calculate totals
        const totalSales = ordersResult.rows.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        const orderCount = ordersResult.rows.length;
        
        res.json({
            success: true,
            session: sessionResult.rows[0],
            orders: ordersResult.rows,
            summary: {
                order_count: orderCount,
                total_sales: totalSales,
                starting_cash: parseFloat(sessionResult.rows[0].starting_cash),
                ending_cash: parseFloat(sessionResult.rows[0].starting_cash) + totalSales
            }
        });
        
    } catch (error) {
        console.error('ERROR getting session sales:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
