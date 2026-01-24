import pool from '../config/db.js';

export const getDailyCashReport = async (req, res) => {
    try {
        const { date } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        // Get all cashier sessions for the date
        const sessionsResult = await pool.query(
            `SELECT cs.*, u.username as cashier_name
             FROM cashier_sessions cs
             JOIN user_table u ON cs.cashier_id = u.uid
             WHERE cs.business_date = $1
             ORDER BY cs.opened_at ASC`,
            [business_date]
        );
        
        // Calculate overall totals
        const totalStartingCash = sessionsResult.rows.reduce((sum, session) => sum + parseFloat(session.starting_cash), 0);
        const totalSales = sessionsResult.rows.reduce((sum, session) => sum + parseFloat(session.total_sales), 0);
        const totalEndingCash = sessionsResult.rows.reduce((sum, session) => sum + parseFloat(session.starting_cash) + parseFloat(session.total_sales), 0);
        
        // Get order counts per session
        const sessionDetails = [];
        
        for (const session of sessionsResult.rows) {
            const orderCountResult = await pool.query(
                'SELECT COUNT(*) as order_count FROM orders WHERE session_id = $1',
                [session.session_id]
            );
            
            sessionDetails.push({
                ...session,
                order_count: parseInt(orderCountResult.rows[0].order_count),
                ending_cash: parseFloat(session.starting_cash) + parseFloat(session.total_sales)
            });
        }
        
        res.json({
            success: true,
            business_date: business_date,
            summary: {
                total_sessions: sessionsResult.rows.length,
                total_starting_cash: totalStartingCash,
                total_sales: totalSales,
                total_ending_cash: totalEndingCash,
                total_orders: sessionDetails.reduce((sum, session) => sum + session.order_count, 0)
            },
            sessions: sessionDetails
        });
        
    } catch (error) {
        console.error('ERROR getting daily cash report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getDailyInventoryReport = async (req, res) => {
    try {
        const { date } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        // Get daily stock data
        const stockResult = await pool.query(
            `SELECT dvs.*, pv.size_label, p.product_name, p.product_id
             FROM daily_variant_stock dvs
             JOIN product_variants pv ON dvs.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id
             WHERE dvs.business_date = $1
             ORDER BY p.product_name, pv.size_label`,
            [business_date]
        );
        
        // Get daily usage data for comparison
        const usageResult = await pool.query(
            `SELECT dvu.*, pv.size_label, p.product_name, p.product_id
             FROM daily_variant_usage dvu
             JOIN product_variants pv ON dvu.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id
             WHERE dvu.business_date = $1
             ORDER BY p.product_name, pv.size_label`,
            [business_date]
        );
        
        // Calculate totals
        const stockTotals = stockResult.rows.reduce((acc, item) => {
            acc.total_opening += parseInt(item.opening_stock);
            acc.total_added += parseInt(item.added_stock);
            acc.total_used += parseInt(item.used_stock);
            acc.total_closing += parseInt(item.closing_stock);
            return acc;
        }, {
            total_opening: 0,
            total_added: 0,
            total_used: 0,
            total_closing: 0
        });
        
        const usageTotals = usageResult.rows.reduce((acc, item) => {
            acc.total_quantity_used += parseInt(item.quantity_used);
            return acc;
        }, {
            total_quantity_used: 0
        });
        
        // Combine stock and usage data
        const combinedData = stockResult.map(stockItem => {
            const usageItem = usageResult.rows.find(u => u.variant_id === stockItem.variant_id);
            return {
                ...stockItem,
                usage_quantity: usageItem ? parseInt(usageItem.quantity_used) : 0,
                variance: usageItem ? parseInt(stockItem.used_stock) - parseInt(usageItem.quantity_used) : parseInt(stockItem.used_stock)
            };
        });
        
        // Find low stock items
        const lowStockThreshold = 10;
        const lowStockItems = combinedData.filter(item => item.closing_stock <= lowStockThreshold);
        
        res.json({
            success: true,
            business_date: business_date,
            summary: {
                total_variants_tracked: stockResult.rows.length,
                total_opening_stock: stockTotals.total_opening,
                total_added_stock: stockTotals.total_added,
                total_used_stock: stockTotals.total_used,
                total_closing_stock: stockTotals.total_closing,
                total_usage_reported: usageTotals.total_quantity_used,
                low_stock_count: lowStockItems.length,
                low_stock_threshold: lowStockThreshold
            },
            stock_data: combinedData,
            low_stock_items: lowStockItems,
            usage_data: usageResult.rows
        });
        
    } catch (error) {
        console.error('ERROR getting daily inventory report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getDailySummaryReport = async (req, res) => {
    try {
        const { date } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        // Get cash report data
        const cashResult = await pool.query(
            `SELECT cs.*, u.username as cashier_name
             FROM cashier_sessions cs
             JOIN user_table u ON cs.cashier_id = u.uid
             WHERE cs.business_date = $1`,
            [business_date]
        );
        
        // Get inventory summary
        const stockResult = await pool.query(
            `SELECT 
                COUNT(*) as total_variants,
                SUM(opening_stock) as total_opening,
                SUM(added_stock) as total_added,
                SUM(used_stock) as total_used,
                SUM(closing_stock) as total_closing
             FROM daily_variant_stock
             WHERE business_date = $1`,
            [business_date]
        );
        
        // Get order summary
        const orderResult = await pool.query(
            `SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COUNT(DISTINCT cashier_id) as active_cashiers
             FROM orders
             WHERE DATE(created_at) = $1`,
            [business_date]
        );
        
        // Get top products for the day
        const topProductsResult = await pool.query(
            `SELECT 
                p.product_name,
                SUM(oi.quantity) as total_sold,
                SUM(oi.subtotal) as total_revenue
             FROM order_items oi
             JOIN products p ON oi.product_id = p.product_id
             JOIN orders o ON oi.order_id = o.order_id
             WHERE DATE(o.created_at) = $1
             GROUP BY p.product_name
             ORDER BY total_sold DESC
             LIMIT 5`,
            [business_date]
        );
        
        // Calculate cash summary
        const cashSummary = cashResult.rows.reduce((acc, session) => {
            acc.total_starting_cash += parseFloat(session.starting_cash);
            acc.total_sales += parseFloat(session.total_sales);
            acc.total_ending_cash += parseFloat(session.starting_cash) + parseFloat(session.total_sales);
            acc.active_sessions += 1;
            return acc;
        }, {
            total_starting_cash: 0,
            total_sales: 0,
            total_ending_cash: 0,
            active_sessions: 0
        });
        
        const stockSummary = stockResult.rows[0] || {
            total_variants: 0,
            total_opening: 0,
            total_added: 0,
            total_used: 0,
            total_closing: 0
        };
        
        const orderSummary = orderResult.rows[0] || {
            total_orders: 0,
            total_sales: 0,
            active_cashiers: 0
        };
        
        res.json({
            success: true,
            business_date: business_date,
            cash_summary: {
                ...cashSummary,
                active_sessions: cashResult.rows.length,
                sessions: cashResult.rows
            },
            inventory_summary: {
                ...stockSummary,
                total_opening_stock: parseInt(stockSummary.total_opening) || 0,
                total_added_stock: parseInt(stockSummary.total_added) || 0,
                total_used_stock: parseInt(stockSummary.total_used) || 0,
                total_closing_stock: parseInt(stockSummary.total_closing) || 0
            },
            order_summary: {
                ...orderSummary,
                total_orders: parseInt(orderSummary.total_orders) || 0,
                total_sales: parseFloat(orderSummary.total_sales) || 0,
                active_cashiers: parseInt(orderSummary.active_cashiers) || 0
            },
            top_products: topProductsResult.rows
        });
        
    } catch (error) {
        console.error('ERROR getting daily summary report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getDailyReportRange = async (req, res) => {
    try {
        const { start_date, end_date, report_type } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date are required' });
        }
        
        if (!report_type || !['cash', 'inventory', 'summary'].includes(report_type)) {
            return res.status(400).json({ error: 'report_type must be cash, inventory, or summary' });
        }
        
        let data;
        
        switch (report_type) {
            case 'cash':
                data = await getCashReportRange(start_date, end_date);
                break;
            case 'inventory':
                data = await getInventoryReportRange(start_date, end_date);
                break;
            case 'summary':
                data = await getSummaryReportRange(start_date, end_date);
                break;
        }
        
        res.json({
            success: true,
            report_type: report_type,
            period: { start_date, end_date },
            data: data
        });
        
    } catch (error) {
        console.error('ERROR getting daily report range:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

async function getCashReportRange(startDate, endDate) {
    const result = await pool.query(
        `SELECT 
            cs.business_date,
            COUNT(*) as session_count,
            SUM(cs.starting_cash) as total_starting_cash,
            SUM(cs.total_sales) as total_sales,
            SUM(cs.starting_cash + cs.total_sales) as total_ending_cash
         FROM cashier_sessions cs
         WHERE cs.business_date >= $1 AND cs.business_date <= $2
         GROUP BY cs.business_date
         ORDER BY cs.business_date`,
        [startDate, endDate]
    );
    
    return result.rows;
}

async function getInventoryReportRange(startDate, endDate) {
    const result = await pool.query(
        `SELECT 
            dvs.business_date,
            COUNT(*) as variant_count,
            SUM(dvs.opening_stock) as total_opening_stock,
            SUM(dvs.added_stock) as total_added_stock,
            SUM(dvs.used_stock) as total_used_stock,
            SUM(dvs.closing_stock) as total_closing_stock
         FROM daily_variant_stock dvs
         WHERE dvs.business_date >= $1 AND dvs.business_date <= $2
         GROUP BY dvs.business_date
         ORDER BY dvs.business_date`,
        [startDate, endDate]
    );
    
    return result.rows;
}

async function getSummaryReportRange(startDate, endDate) {
    const result = await pool.query(
        `SELECT 
            DATE(o.created_at) as business_date,
            COUNT(*) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_sales,
            COUNT(DISTINCT o.cashier_id) as active_cashiers
         FROM orders o
         WHERE DATE(o.created_at) >= $1 AND DATE(o.created_at) <= $2
         GROUP BY DATE(o.created_at)
         ORDER BY business_date`,
        [startDate, endDate]
    );
    
    return result.rows;
}
