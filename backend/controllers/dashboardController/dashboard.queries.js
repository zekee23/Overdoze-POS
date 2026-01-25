import pool from "../../config/db.js";

export const getHomeData = async (req,res) =>
{
    try{
    const [
        kpitodayresult,
        hourlygraph
    ] = await Promise.all([
        
        pool.query ( `SELECT 
            COUNT(*) AS total_orders, 
            COALESCE(SUM(total_amount), 0) AS total_sales,
            u.username AS cashier_name
            FROM orders o
            LEFT JOIN user_table u ON o.cashier_id = u.uid
            WHERE o.created_at >= CURRENT_DATE
            AND o.created_at < CURRENT_DATE + INTERVAL '1 day'
            GROUP BY u.username;`),

        pool.query(`SELECT EXTRACT(HOUR FROM created_at) AS hour,
            COUNT(*) AS order_count 
            FROM orders 
            WHERE DATE(created_at) = CURRENT_DATE
            GROUP BY hour
            ORDER BY hour`)
    ]);
    res.json({
        KPIToday:kpitodayresult.rows,
        Hourly_Orders: hourlygraph.rows,
        success:true
    })
}

    catch(err)
    {
        console.error("ERROR LOADING: ", err)
        res.status(500).json({error:"Internal Server Error"})

    }
}



export const getStock = async(req,res) =>
{
    try {
        const stockResult = await pool.query(`
            SELECT * FROM products
            WHERE is_active = false`);
        res.json({
            stock:stockResult.rows,
            success:true
        })
        
    } catch (error) {
        console.log("ERROR FETCHING STOCK: ", error);
        res.status(500).json({error:"INTERNAL SERVER ERROR"})
    }

}
//returning products to be active
export const setStockStatus = async(req,res) =>
{
    const { id } = req.params;

    try {
        // Check if product exists
        const productExists = await pool.query(
            `SELECT product_id FROM products WHERE product_id = $1`,
            [id]
        );
        
        if (productExists.rows.length === 0) {
            return res.status(404).json({error:"Product Not Found"})
        }
        
        // Set product as out of stock
        const result = await pool.query(
            `UPDATE products
            SET is_active = false
            WHERE product_id = $1 
            RETURNING *`,
            [id]
        );
        
        res.json({
            ...result.rows[0],
            message: "Product marked as out of stock successfully"
        });

    } catch (error) {
        console.log("Error Updating Product: ", error);
        res.status(500).json({error: "Internal Server Error"})
        
    }
}
export const setStockStatusActive = async(req,res) =>
{
    const { id } = req.params;

    try {
        // Check if product exists
        const productExists = await pool.query(
            `SELECT product_id FROM products WHERE product_id = $1`,
            [id]
        );
        
        if (productExists.rows.length === 0) {
            return res.status(404).json({error:"Product Not Found"})
        }
        
        // Set product as out of stock
        const result = await pool.query(
            `UPDATE products
            SET is_active = true
            WHERE product_id = $1 
            RETURNING *`,
            [id]
        );
        
        res.json({
            ...result.rows[0],
            message: "Product marked as out of stock successfully"
        });

    } catch (error) {
        console.log("Error Updating Product: ", error);
        res.status(500).json({error: "Internal Server Error"})
        
    }
}

export const getOrderHistory = async(req,res) =>
{
    try {
        const { month, page = 1, limit = 10 } = req.query; // 'this' or 'last', pagination params
        const offset = (page - 1) * limit;
        
        let dateCondition;

if (month === 'this') {
  dateCondition = `
    o.created_at >= date_trunc('month', CURRENT_DATE)
    AND o.created_at < date_trunc('month', CURRENT_DATE + INTERVAL '1 month')
  `;
} else if (month === 'last') {
  dateCondition = `
    o.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
    AND o.created_at < date_trunc('month', CURRENT_DATE)
  `;
} else {
  dateCondition = `
    o.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
    AND o.created_at < date_trunc('month', CURRENT_DATE + INTERVAL '1 month')
  `;
}

        
        // Get total count for pagination
        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM orders o WHERE ${dateCondition}`
        );
        
        // Get paginated orders
       const historyResult = await pool.query(
  `
  SELECT 
    o.order_id,
    o.total_amount,
    u.full_name AS cashier_name,
    o.created_at
  FROM orders o
  JOIN user_table u ON o.cashier_id = u.uid
  WHERE ${dateCondition}
  ORDER BY o.created_at DESC
  LIMIT $1 OFFSET $2
  `,
  [limit, offset]
);
        
        const totalOrders = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalOrders / limit);
        
        res.json({
            orders: historyResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalOrders: totalOrders,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.log("ERROR FETCHING ORDER HISTORY: ", error);
        res.status(500).json({error:"INTERNAL SERVER ERROR"})
    }
    
}

export const getPeakHours = async(req,res) =>
{
    try {
        const peakHoursResult = await pool.query(
            `SELECT 
                EXTRACT(HOUR FROM created_at) AS hour,
                COUNT(*) AS order_count,
                COALESCE(SUM(total_amount), 0) AS total_sales,
                DATE(created_at) AS order_date
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '15 days'
                AND created_at < CURRENT_DATE + INTERVAL '1 day'
            GROUP BY hour, DATE(created_at)
            ORDER BY order_date DESC, hour`
        );
        
        // Calculate hourly averages across the 15 days
        const hourlyAverages = await pool.query(
            `SELECT 
                EXTRACT(HOUR FROM created_at) AS hour,
                COUNT(*) AS total_orders,
                COALESCE(SUM(total_amount), 0) AS total_sales,
                ROUND(COUNT(*)::decimal / 15, 2) AS avg_orders_per_day,
                ROUND(COALESCE(SUM(total_amount), 0)::decimal / 15, 2) AS avg_sales_per_day
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '15 days'
                AND created_at < CURRENT_DATE + INTERVAL '1 day'
            GROUP BY hour
            ORDER BY hour`
        );
        
        // Find peak hours (top 3 by order count)
        const peakHoursByOrders = hourlyAverages.rows
            .sort((a, b) => b.total_orders - a.total_orders)
            .slice(0, 3);
            
        // Find peak hours by sales (top 3 by sales amount)
        const peakHoursBySales = hourlyAverages.rows
            .sort((a, b) => b.total_sales - a.total_sales)
            .slice(0, 3);
        
        res.json({
            dailyBreakdown: peakHoursResult.rows,
            hourlyAverages: hourlyAverages.rows,
            peakHoursByOrders: peakHoursByOrders,
            peakHoursBySales: peakHoursBySales,
            analysisPeriod: 'Last 15 days'
        });
        
    } catch (error) {
        console.log("ERROR FETCHING PEAK HOURS: ", error);
        res.status(500).json({error:"INTERNAL SERVER ERROR"})
    }
}

export const getUser = async(req, res)=>
{
    try {
       const userResult = await pool.query(
        `SELECT * From user_table
        WHERE u_role = 'cashier'`
       )
       res.json(userResult.rows);
    } catch (error) {
        console.log('ERROR fetching users: ', error);
        res.status(500).json({error:"Internal Server Error"})
    }
}

export const createUser = async(req, res) => {
    try {
        const { username, full_name, u_role = 'cashier' } = req.body;
        
        // Validate required fields
        if (!username || !full_name) {
            return res.status(400).json({ error: 'Username and full name are required' });
        }
        
        // Check if username already exists
        const existingUser = await pool.query(
            'SELECT uid FROM user_table WHERE username = $1',
            [username]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Create new user
        const result = await pool.query(
            `INSERT INTO user_table (username, full_name, u_role, created_at) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
             RETURNING uid, username, full_name, u_role, created_at`,
            [username, full_name, u_role]
        );
        
        res.status(201).json({ 
            message: 'User created successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.log('ERROR creating user: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const editUser = async(req,res) =>
{
    const {uid} = req.params;
    const {full_name, username} = req.body;
    try {
        if(!full_name || !username)
        {
            return res.status(400).json({error: "Full name and Username is required!"})
        }
        
        const updateUser = await pool.query(
            `UPDATE user_table
            SET full_name = $1, username = $2 
            WHERE uid = $3 
            RETURNING username, full_name, u_role`,
            [full_name, username, uid]
        )
        if(updateUser.rows.length === 0)
        {
            return res.status(404).json({error:"User not found!"})
        }
        res.json(updateUser.rows[0]);

        
       
        
    } catch (error) {
          console.error('Error updating User:', error);
        res.status(500).json({ error: 'Internal server error' });

        
    }


}

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


//GET /api/monthly-order-summary          // Current month (January 2026)
//GET /api/monthly-order-summary?month=1  // January 
//GET /api/top-products                    // Current month top 3
//GET /api/top-products?month=12&year=2025 // December 2025 top 3


export const getMonthlyOrderSummary = async(req,res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        
        const summary = await pool.query(
            `SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                COUNT(order_id) AS total_orders,
                COALESCE(SUM(total_amount), 0) AS gross_sales
            FROM orders
            WHERE EXTRACT(MONTH FROM created_at) = $1
            AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY month;`,
            [targetMonth, targetYear]
        );
        res.json(summary.rows);

    } catch (error) {
        console.log('ERROR fetching monthly order summary: ', error);
        res.status(500).json({error:"Internal Server Error"});
    }
}

export const getTop3ProductsPerMonth = async(req,res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        
        const topProducts = await pool.query(
            `SELECT 
                p.product_name,
                SUM(oi.quantity) AS total_sold,
                SUM(oi.subtotal) AS total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE EXTRACT(MONTH FROM o.created_at) = $1
            AND EXTRACT(YEAR FROM o.created_at) = $2
            GROUP BY p.product_name
            ORDER BY total_sold DESC
            LIMIT 3`,
            [targetMonth, targetYear]
        );
        
        res.json(topProducts.rows);
    } catch (error) {
        console.log('ERROR fetching top products: ', error);
        res.status(500).json({error:"Internal Server Error"});
    }
}

export const getMonthlyDashboard = async (req, res) => {
    try {
        const { month } = req.query;
        
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Month parameter required in YYYY-MM format' });
        }
        
        const startDate = `${month}-01`;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const dashboardQuery = `
            WITH monthly_orders AS (
                SELECT 
                    COUNT(order_id) AS total_orders,
                    COALESCE(SUM(total_amount), 0) AS gross_sales
                FROM orders
                WHERE created_at >= $1 AND created_at < $2
            ),
            monthly_cash_data AS (
                SELECT 
                    COALESCE(starting_cash, 0) AS starting_cash
                FROM monthly_cash
                WHERE month = DATE_TRUNC('month', $1::date)
                LIMIT 1
            ),
            top_products AS (
                SELECT 
                    p.product_name,
                    SUM(oi.quantity) AS total_sold,
                    SUM(oi.subtotal) AS total_revenue
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                JOIN orders o ON oi.order_id = o.order_id
                WHERE o.created_at >= $1 AND o.created_at < $2
                GROUP BY p.product_name
                ORDER BY total_revenue DESC
                LIMIT 3
            )
            SELECT 
                mo.total_orders,
                mo.gross_sales,
                mcd.starting_cash,
                CASE 
                    WHEN mcd.starting_cash > 0 
                    THEN mo.gross_sales - mcd.starting_cash
                    ELSE 0 
                END AS profit,
                tp.product_name,
                tp.total_sold,
                tp.total_revenue
            FROM monthly_orders mo
            CROSS JOIN monthly_cash_data mcd
            CROSS JOIN top_products tp`;
        
        const result = await pool.query(dashboardQuery, [startDate, endDateStr]);
        
        if (result.rows.length === 0) {
            return res.json({
                total_orders: 0,
                gross_sales: 0,
                starting_cash: 0,
                profit: 0,
                top_products: []
            });
        }
        
        const firstRow = result.rows[0];
        const topProducts = result.rows.map(row => ({
            product_name: row.product_name,
            total_sold: parseInt(row.total_sold),
            total_revenue: parseFloat(row.total_revenue)
        }));
        
        res.json({
            total_orders: parseInt(firstRow.total_orders),
            gross_sales: parseFloat(firstRow.gross_sales),
            starting_cash: parseFloat(firstRow.starting_cash),
            profit: parseFloat(firstRow.profit),
            top_products: topProducts
        });
        
    } catch (error) {
        console.error('ERROR fetching monthly dashboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const setMonthlyCash = async (req, res) => {
    try {
        const { month, starting_cash } = req.body;
        
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Month parameter required in YYYY-MM format' });
        }
        
        if (!starting_cash || isNaN(starting_cash) || parseFloat(starting_cash) < 0) {
            return res.status(400).json({ error: 'Valid starting cash amount required' });
        }
        
        const monthDate = `${month}-01`;
        
        const result = await pool.query(
            `INSERT INTO monthly_cash (month, starting_cash, created_by)
             VALUES (DATE_TRUNC('month', $1::date), $2, $3)
             ON CONFLICT (month) 
             DO UPDATE SET 
                 starting_cash = EXCLUDED.starting_cash,
                 created_by = EXCLUDED.created_by,
                 created_at = NOW()
             RETURNING *`,
            [monthDate, parseFloat(starting_cash), req.userId]
        );
        
        res.json({
            message: 'Monthly cash set successfully',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('ERROR setting monthly cash:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const saveMonthlyReport = async (req, res) => {
    try {
        const { month } = req.body;
        
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Month parameter required in YYYY-MM format' });
        }
        
        const startDate = `${month}-01`;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Check if month has ended (can only save reports for completed months)
        const now = new Date();
        if (endDate > now) {
            return res.status(400).json({ error: 'Cannot save report for incomplete month' });
        }
        
        // Get monthly dashboard data
        const dashboardQuery = `
            WITH monthly_orders AS (
                SELECT 
                    COUNT(order_id) AS total_orders,
                    COALESCE(SUM(total_amount), 0) AS gross_sales
                FROM orders
                WHERE created_at >= $1 AND created_at < $2
            ),
            monthly_cash_data AS (
                SELECT 
                    COALESCE(starting_cash, 0) AS starting_cash
                FROM monthly_cash
                WHERE month = DATE_TRUNC('month', $1::date)
                LIMIT 1
            ),
            top_products AS (
                SELECT 
                    p.product_name,
                    SUM(oi.quantity) AS total_sold,
                    SUM(oi.subtotal) AS total_revenue
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                JOIN orders o ON oi.order_id = o.order_id
                WHERE o.created_at >= $1 AND o.created_at < $2
                GROUP BY p.product_name
                ORDER BY total_revenue DESC
                LIMIT 3
            )
            SELECT 
                mo.total_orders,
                mo.gross_sales,
                mcd.starting_cash,
                CASE 
                    WHEN mcd.starting_cash > 0 
                    THEN mo.gross_sales - mcd.starting_cash
                    ELSE 0 
                END AS profit,
                COALESCE(
                    (SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'product_name', tp.product_name,
                            'total_sold', tp.total_sold,
                            'total_revenue', tp.total_revenue
                        )
                    ) FROM top_products tp), 
                    '[]'::json
                ) AS top_products
            FROM monthly_orders mo
            CROSS JOIN monthly_cash_data mcd`;
        
        const result = await pool.query(dashboardQuery, [startDate, endDateStr]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No data found for the specified month' });
        }
        
        const data = result.rows[0];
        
        // Check if starting cash is set
        if (!data.starting_cash || data.starting_cash <= 0) {
            return res.status(400).json({ error: 'Starting cash must be set before saving monthly report' });
        }
        
        // Save to monthly_reports table
        const saveResult = await pool.query(
            `INSERT INTO monthly_reports (month, total_orders, gross_sales, starting_cash, profit, top_products, created_by)
             VALUES (DATE_TRUNC('month', $1::date), $2, $3, $4, $5, $6, $7)
             ON CONFLICT (month) 
             DO UPDATE SET 
                 total_orders = EXCLUDED.total_orders,
                 gross_sales = EXCLUDED.gross_sales,
                 starting_cash = EXCLUDED.starting_cash,
                 profit = EXCLUDED.profit,
                 top_products = EXCLUDED.top_products,
                 updated_at = NOW()
             RETURNING *`,
            [
                startDate,
                parseInt(data.total_orders),
                parseFloat(data.gross_sales),
                parseFloat(data.starting_cash),
                parseFloat(data.profit),
                JSON.stringify(data.top_products),
                req.userId
            ]
        );
        
        res.json({
            message: 'Monthly report saved successfully',
            data: {
                id: saveResult.rows[0].id,
                month: month,
                total_orders: parseInt(data.total_orders),
                gross_sales: parseFloat(data.gross_sales),
                starting_cash: parseFloat(data.starting_cash),
                profit: parseFloat(data.profit),
                top_products: data.top_products,
                created_at: saveResult.rows[0].created_at
            }
        });
        
    } catch (error) {
        console.error('ERROR saving monthly report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getSavedReports = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM monthly_reports'
        );
        
        // Get paginated reports with user info
        const reportsResult = await pool.query(
            `SELECT 
                mr.id,
                TO_CHAR(mr.month, 'YYYY-MM') AS month,
                mr.total_orders,
                mr.gross_sales,
                mr.starting_cash,
                mr.profit,
                mr.top_products,
                mr.pdf_file_path,
                mr.pdf_generated_at,
                mr.created_at,
                mr.updated_at,
                u.username AS created_by_name
            FROM monthly_reports mr
            JOIN user_table u ON mr.created_by = u.uid
            ORDER BY mr.month DESC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        
        const totalReports = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalReports / limit);
        
        res.json({
            reports: reportsResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalReports: totalReports,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('ERROR fetching saved reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteSavedReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        
        // Check if report exists
        const reportExists = await pool.query(
            'SELECT id, pdf_file_path FROM monthly_reports WHERE id = $1',
            [reportId]
        );
        
        if (reportExists.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        // Delete the report
        await pool.query(
            'DELETE FROM monthly_reports WHERE id = $1',
            [reportId]
        );
        
        res.json({ message: 'Report deleted successfully' });
        
    } catch (error) {
        console.error('ERROR deleting saved report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};