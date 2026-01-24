import pool from "../config/db.js";

export const setStartingCash = async (req, res) => {
    try {
        const { starting_cash } = req.body;
        const user_id = req.user?.id || req.user?.user_id;

        if (!starting_cash || starting_cash < 0) {
            return res.status(400).json({ error: 'Starting cash must be a positive number' });
        }

        // Check if starting cash already exists for today
        const existingCheck = await pool.query(
            'SELECT business_date FROM daily_cash_drawer WHERE business_date = CURRENT_DATE'
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Starting cash has already been set for today' });
        }

        // Insert starting cash for today
        const result = await pool.query(
            `INSERT INTO daily_cash_drawer (business_date, starting_cash, created_by) 
             VALUES (CURRENT_DATE, $1, $2) 
             RETURNING *`,
            [starting_cash, user_id]
        );

        res.json({
            message: 'Starting cash set successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error setting starting cash:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTodayStartingCash = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT starting_cash, created_at FROM daily_cash_drawer WHERE business_date = CURRENT_DATE'
        );

        if (result.rows.length === 0) {
            return res.json({ starting_cash: 0, exists: false });
        }

        res.json({ 
            starting_cash: parseFloat(result.rows[0].starting_cash), 
            exists: true,
            created_at: result.rows[0].created_at
        });
    } catch (error) {
        console.error('Error getting starting cash:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getExpectedCashInDrawer = async (req, res) => {
    try {
        // Get today's starting cash
        const startingCashResult = await pool.query(
            'SELECT starting_cash FROM daily_cash_drawer WHERE business_date = CURRENT_DATE'
        );

        const starting_cash = startingCashResult.rows.length > 0 
            ? parseFloat(startingCashResult.rows[0].starting_cash) 
            : 0;

        // Get today's total sales from orders
        const salesResult = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total_sales 
            FROM orders 
            WHERE DATE(created_at) = CURRENT_DATE
        `);

        const total_sales = parseFloat(salesResult.rows[0].total_sales);

        const expected_cash = starting_cash + total_sales;

        res.json({
            starting_cash,
            total_sales,
            expected_cash
        });
    } catch (error) {
        console.error('Error calculating expected cash:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
