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