import pool from '../config/db.js';

export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cashier_id, cart, total_amount } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    await client.query('BEGIN');

    // 1️⃣ Create ORDER
    const orderResult = await client.query(
      `INSERT INTO orders (cashier_id, total_amount)
       VALUES ($1, $2)
       RETURNING order_id`,
      [cashier_id, total_amount]
    );

    const orderId = orderResult.rows[0].order_id;

    // 2️⃣ Process ITEMS
    for (const item of cart) {

      // 🔒 Fetch price from DB (SECURITY)
      const variantRes = await client.query(
        `SELECT price FROM product_variants WHERE variant_id = $1`,
        [item.variant.variant_id]
      );

      if (variantRes.rowCount === 0) {
        throw new Error('Invalid variant');
      }

      const priceEach = variantRes.rows[0].price;
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

      // 3️⃣ Add ADD-ONS
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

    res.status(201).json({
      success: true,
      order_id: orderId
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
      GROUP BY o.order_id, o.total_amount, o.created_at, u.username
      ORDER BY o.created_at DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load orders' });
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

