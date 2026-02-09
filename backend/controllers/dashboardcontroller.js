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

export const getPaymentMethodStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let dateFilter = '';
    
    switch (period) {
      case 'today':
        dateFilter = `DATE(o.created_at) = CURRENT_DATE`;
        break;
      case 'week':
        dateFilter = `o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        break;
      case 'month':
        dateFilter = `o.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
        break;
      case 'year':
        dateFilter = `o.created_at >= DATE_TRUNC('year', CURRENT_DATE)`;
        break;
      default:
        dateFilter = `DATE(o.created_at) = CURRENT_DATE`;
    }

    const query = `
      SELECT 
        payment_method,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        ROUND(COALESCE(SUM(total_amount), 0), 2) as formatted_amount
      FROM orders o
      WHERE ${dateFilter}
      AND o.payment_method IS NOT NULL
      GROUP BY payment_method
      ORDER BY payment_method
    `;

    const result = await pool.query(query);
    
    // Initialize default values
    let cashTotal = 0;
    let gcashTotal = 0;
    let cashOrders = 0;
    let gcashOrders = 0;

    // Process results
    result.rows.forEach(row => {
      if (row.payment_method === 'cash') {
        cashTotal = parseFloat(row.total_amount);
        cashOrders = parseInt(row.order_count);
      } else if (row.payment_method === 'gcash') {
        gcashTotal = parseFloat(row.total_amount);
        gcashOrders = parseInt(row.order_count);
      }
    });

    const totalRevenue = cashTotal + gcashTotal;
    const totalOrders = cashOrders + gcashOrders;

    res.json({
      period,
      cash: {
        amount: cashTotal,
        orders: cashOrders,
        percentage: totalRevenue > 0 ? ((cashTotal / totalRevenue) * 100).toFixed(1) : '0.0'
      },
      gcash: {
        amount: gcashTotal,
        orders: gcashOrders,
        percentage: totalRevenue > 0 ? ((gcashTotal / totalRevenue) * 100).toFixed(1) : '0.0'
      },
      total: {
        amount: totalRevenue,
        orders: totalOrders
      }
    });

  } catch (err) {
    console.error('Error fetching payment method stats:', err);
    res.status(500).json({ 
      error: 'Failed to fetch payment method statistics',
      message: err.message 
    });
  }
};