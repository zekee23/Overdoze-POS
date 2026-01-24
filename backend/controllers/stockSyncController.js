import pool from '../config/db.js';
import { updateStockFromUsage } from './dailyStockController.js';

// Sync stock from existing order_items for a specific date
export const syncStockFromOrderItems = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { date } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0];
        
        // Get all order items for the specified date
        const orderItemsResult = await client.query(`
            SELECT 
                oi.variant_id,
                SUM(oi.quantity) as total_quantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE DATE(o.created_at) = $1
            GROUP BY oi.variant_id
        `, [business_date]);
        
        if (orderItemsResult.rows.length === 0) {
            return res.json({
                success: true,
                message: 'No orders found for the specified date',
                business_date: business_date,
                variants_updated: 0
            });
        }
        
        let successCount = 0;
        let errorCount = 0;
        const results = [];
        
        // Update stock for each variant
        for (const item of orderItemsResult.rows) {
            try {
                const result = await updateStockFromUsage(
                    business_date, 
                    item.variant_id, 
                    item.total_quantity
                );
                
                if (result.success) {
                    successCount++;
                    results.push({
                        variant_id: item.variant_id,
                        quantity: item.total_quantity,
                        status: 'success',
                        message: result.message
                    });
                } else {
                    errorCount++;
                    results.push({
                        variant_id: item.variant_id,
                        quantity: item.total_quantity,
                        status: 'error',
                        error: result.error
                    });
                }
            } catch (error) {
                errorCount++;
                results.push({
                    variant_id: item.variant_id,
                    quantity: item.total_quantity,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            business_date: business_date,
            total_variants: orderItemsResult.rows.length,
            successful_updates: successCount,
            failed_updates: errorCount,
            details: results
        });
        
    } catch (error) {
        console.error('ERROR syncing stock from order items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// Get stock vs orders comparison for a date
export const getStockVsOrdersComparison = async (req, res) => {
    try {
        const { date } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0];
        
        // Get stock data
        const stockResult = await pool.query(`
            SELECT 
                dvs.variant_id,
                dvs.opening_stock,
                dvs.added_stock,
                dvs.used_stock,
                dvs.closing_stock,
                pv.size_label,
                p.product_name
            FROM daily_variant_stock dvs
            JOIN product_variants pv ON dvs.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE dvs.business_date = $1
            ORDER BY p.product_name, pv.size_label
        `, [business_date]);
        
        // Get actual orders data
        const ordersResult = await pool.query(`
            SELECT 
                oi.variant_id,
                SUM(oi.quantity) as actual_orders
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE DATE(o.created_at) = $1
            GROUP BY oi.variant_id
        `, [business_date]);
        
        // Create a map for easy lookup
        const ordersMap = {};
        ordersResult.rows.forEach(row => {
            ordersMap[row.variant_id] = parseInt(row.actual_orders);
        });
        
        // Combine data and calculate discrepancies
        const comparison = stockResult.rows.map(stock => ({
            variant_id: stock.variant_id,
            product_name: stock.product_name,
            size_label: stock.size_label,
            opening_stock: parseInt(stock.opening_stock),
            added_stock: parseInt(stock.added_stock),
            system_used_stock: parseInt(stock.used_stock),
            actual_orders: ordersMap[stock.variant_id] || 0,
            closing_stock: parseInt(stock.closing_stock),
            discrepancy: parseInt(stock.used_stock) - (ordersMap[stock.variant_id] || 0),
            is_discrepant: parseInt(stock.used_stock) !== (ordersMap[stock.variant_id] || 0)
        }));
        
        const totalDiscrepancies = comparison.filter(item => item.is_discrepant).length;
        
        res.json({
            success: true,
            business_date: business_date,
            total_variants: comparison.length,
            discrepancies_found: totalDiscrepancies,
            comparison: comparison
        });
        
    } catch (error) {
        console.error('ERROR getting stock vs orders comparison:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
