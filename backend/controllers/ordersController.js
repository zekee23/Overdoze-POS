import pool from '../config/db.js';
import { updateUsageFromOrder } from './variantUsageController.js';
import { updateStockFromUsage } from './dailyStockController.js';

export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cashier_id, cart, total_amount, session_id, payment_method } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate payment method
    if (payment_method && !['cash', 'gcash'].includes(payment_method)) {
      return res.status(400).json({ message: 'Invalid payment method. Must be cash or gcash' });
    }

    // Validate session if provided
    if (session_id) {
      const sessionResult = await client.query(
        'SELECT session_id FROM cashier_sessions WHERE session_id = $1 AND session_status = $2',
        [session_id, 'active']
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or inactive session' });
      }
    }

    await client.query('BEGIN');

    // 1️⃣ Create ORDER
    const orderResult = await client.query(
      `INSERT INTO orders (cashier_id, total_amount, session_id, payment_method)
       VALUES ($1, $2, $3, $4)
       RETURNING order_id`,
      [cashier_id, total_amount, session_id || null, payment_method || 'cash']
    );

    const orderId = orderResult.rows[0].order_id;

    // 2️⃣ Process ITEMS and deduct cup stock
    for (const item of cart) {

      // 🔒 Fetch price from DB (SECURITY)
      const variantRes = await client.query(
        `SELECT price, size_label FROM product_variants WHERE variant_id = $1`,
        [item.variant.variant_id]
      );

      if (variantRes.rowCount === 0) {
        throw new Error('Invalid variant');
      }

      const priceEach = variantRes.rows[0].price;
      const sizeLabel = variantRes.rows[0].size_label;
      const subtotal = priceEach * item.quantity;

      const itemResult = await client.query(
        `INSERT INTO order_items
         (order_id, product_id, variant_id, quantity, price_each, subtotal, sugarlevel_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING order_item_id`,
        [
          orderId,
          item.product_id,
          item.variant.variant_id,
          item.quantity,
          priceEach,
          subtotal,
          item.sugar?.sugarlevel_id || null

        ]
      );

      const orderItemId = itemResult.rows[0].order_item_id;

      // 3️⃣ Deduct cup stock atomically
      if (sizeLabel) {
        await client.query(
          'SELECT deduct_cup_stock($1, $2)',
          [sizeLabel, item.quantity]
        );
      }

      // 4️⃣ Add ADD-ONS
      let addonsTotal = 0;

for (const addon of item.addons) {
  const addonRes = await client.query(
    `SELECT price FROM addons_item WHERE add_id = $1`,
    [addon.add_id]
  );

  if (addonRes.rowCount === 0) {
    throw new Error('Invalid addon');
  }

  addonsTotal += addonRes.rows[0].price * (addon.quantity || 1);

  await client.query(
    `INSERT INTO order_item_addons
     (order_item_id, add_id, quantity)
     VALUES ($1,$2,$3)`,
    [orderItemId, addon.add_id, addon.quantity || 1]
  );
}

    }

    await client.query('COMMIT');

    // Update daily variant usage and stock after successful order creation
    try {
      const business_date = new Date().toISOString().split('T')[0]; // CURRENT_DATE
      
      // Update usage for each variant in the order
      for (const item of cart) {
        await updateStockFromUsage(business_date, item.variant.variant_id, item.quantity);
      }
      
      // Update usage tracking
      await updateUsageFromOrder(orderId);
      
    } catch (usageError) {
      console.error('ERROR updating usage/stock:', usageError);
      // Don't fail the order, just log the error
    }

    res.status(201).json({
      success: true,
      order_id: orderId,
      session_id: session_id || null
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CREATE ORDER ERROR:', err);

    res.status(500).json({
      message: 'Order failed',
      error: err.message
    });
  } finally {
    client.release();
  }
};


export const getOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.order_id,
        o.total_amount,
        o.payment_method,
        o.created_at,
        u.username as cashier_name,
        json_agg(
          json_build_object(
            'order_item_id', oi.order_item_id,
            'product_name', p.product_name,
            'size_label', pv.size_label,
            'quantity', oi.quantity,
            'price_each', oi.price_each,
            'subtotal', oi.subtotal,
            'addons', COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'add_id', ai.add_id,
                    'extras_name', ai.extras_name,
                    'price', ai.price,
                    'quantity', oia.quantity
                  )
                )
                FROM order_item_addons oia
                JOIN addons_item ai ON oia.add_id = ai.add_id
                WHERE oia.order_item_id = oi.order_item_id
              ),
              '[]'::json
            )
          )
        ) AS items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.order_id
      JOIN products p ON p.product_id = oi.product_id
      JOIN product_variants pv ON pv.variant_id = oi.variant_id
      LEFT JOIN user_table u ON u.uid = o.cashier_id
      GROUP BY o.order_id, o.total_amount, o.payment_method, o.created_at, u.username
      ORDER BY o.created_at DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
};

export const deleteOrdersByMonth = async (req, res) => {
  const client = await pool.connect();
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    await client.query('BEGIN');

    // Delete orders and related data for the specified month
    const deleteResult = await client.query(`
      DELETE FROM orders 
      WHERE EXTRACT(MONTH FROM created_at) = $1 
      AND EXTRACT(YEAR FROM created_at) = $2
      RETURNING order_id
    `, [month, year]);

    const deletedCount = deleteResult.rowCount;

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: `Deleted ${deletedCount} orders for ${year}-${month.toString().padStart(2, '0')}`,
      deletedCount 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE ORDERS BY MONTH ERROR:', err);
    res.status(500).json({ 
      error: 'Failed to delete orders',
      message: err.message 
    });
  } finally {
    client.release();
  }
};

export const deleteOldOrders = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current date and calculate cutoff date (start of last month)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11 (0 = January)
    
    // Calculate cutoff: start of last month
    // If current is Feb 2026 (month 1), we want to keep Feb 2026 + Jan 2026, so cutoff is Jan 1, 2026
    // If current is Mar 2026 (month 2), we want to keep Mar 2026 + Feb 2026, so cutoff is Feb 1, 2026
    const cutoffYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const cutoffMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const cutoffDate = new Date(cutoffYear, cutoffMonth, 1);

    console.log(`Current: ${now.toLocaleDateString()}, Cutoff: ${cutoffDate.toLocaleDateString()}`);
    console.log(`Deleting orders created before: ${cutoffDate.toISOString()}`);

    // 1. First, check what would be deleted
    const checkResult = await client.query(`
      SELECT COUNT(*) as count_to_delete
      FROM orders 
      WHERE created_at < $1
    `, [cutoffDate]);
    
    const ordersToDelete = checkResult.rows[0].count_to_delete;
    console.log(`Found ${ordersToDelete} orders to delete`);

    if (ordersToDelete == 0) {
      await client.query('ROLLBACK');
      return res.json({ 
        success: true, 
        message: 'No orders found to delete (only current and last month data kept)',
        deletedCount: 0,
        cutoffDate: cutoffDate.toISOString()
      });
    }

    // 2. Delete from order_item_addons (child table)
    const deleteAddonsResult = await client.query(`
      DELETE FROM order_item_addons 
      WHERE order_item_id IN (
        SELECT oi.order_item_id
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.created_at < $1
      )
    `, [cutoffDate]);

    // 3. Delete from order_items (middle table)
    const deleteItemsResult = await client.query(`
      DELETE FROM order_items 
      WHERE order_id IN (
        SELECT order_id FROM orders WHERE created_at < $1
      )
    `, [cutoffDate]);

    // 4. Finally, delete from orders (parent table)
    const deleteOrdersResult = await client.query(`
      DELETE FROM orders 
      WHERE created_at < $1
      RETURNING order_id, created_at
    `, [cutoffDate]);

    await client.query('COMMIT');

    const deletedCount = deleteOrdersResult.rowCount;
    const deletedOrders = deleteOrdersResult.rows;

    res.json({ 
      success: true, 
      message: `Deleted ${deletedCount} orders older than ${cutoffDate.toLocaleDateString()} (kept current and last month data)`,
      deletedCount,
      deletedOrders: deletedOrders.map(order => ({
        order_id: order.order_id,
        created_at: order.created_at
      })),
      cutoffDate: cutoffDate.toISOString(),
      summary: {
        addonsDeleted: deleteAddonsResult.rowCount,
        itemsDeleted: deleteItemsResult.rowCount,
        ordersDeleted: deletedCount
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE OLD ORDERS ERROR:', err);
    res.status(500).json({ 
      error: 'Failed to delete old orders',
      message: err.message 
    });
  } finally {
    client.release();
  }
};

export const deleteOrderById = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    await client.query('BEGIN');

    // Delete the specific order (related records will be deleted due to foreign key constraints)
    const deleteResult = await client.query(`
      DELETE FROM orders 
      WHERE order_id = $1
      RETURNING order_id
    `, [id]);

    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: `Order ${id} deleted successfully`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE ORDER BY ID ERROR:', err);
    res.status(500).json({ 
      error: 'Failed to delete order',
      message: err.message 
    });
  } finally {
    client.release();
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order details first
    const orderResult = await pool.query(`
      SELECT
        o.order_id,
        o.total_amount,
        o.payment_method,
        o.created_at,
        u.username as cashier_name
      FROM orders o
      LEFT JOIN user_table u ON u.uid = o.cashier_id
      WHERE o.order_id = $1
    `, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items with addons
    const itemsResult = await pool.query(`
      SELECT
        oi.order_item_id,
        oi.product_id,
        p.product_name,
        oi.variant_id,
        pv.size_label,
        oi.quantity,
        oi.price_each,
        oi.subtotal,
        COALESCE(
          json_agg(
            json_build_object(
              'add_id', ai.add_id,
              'extras_name', ai.extras_name,
              'price', ai.price,
              'quantity', oia.quantity
            )
          ) FILTER (WHERE ai.add_id IS NOT NULL), 
          '[]'::json
        ) AS addons
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
      LEFT JOIN order_item_addons oia ON oi.order_item_id = oia.order_item_id
      LEFT JOIN addons_item ai ON oia.add_id = ai.add_id
      WHERE oi.order_id = $1
      GROUP BY oi.order_item_id, p.product_name, pv.size_label, oi.quantity, oi.price_each, oi.subtotal
    `, [id]);

    const response = {
      ...order,
      items: itemsResult.rows
    };

    res.json(response);
  } catch (err) {
    console.error('Failed to load order:', err);
    res.status(500).json({ error: 'Failed to load order' });
  }
};

