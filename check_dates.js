import pool from './backend/config/db.js';

async function checkOrderDates() {
  const client = await pool.connect();
  try {
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

    console.log('Current date:', now.toLocaleDateString());
    console.log('Cutoff date (delete orders before this):', cutoffDate.toLocaleDateString());
    console.log('Keeping data for: Current month + Last month');
    
    // Check overall date range
    const result = await client.query('SELECT MIN(created_at), MAX(created_at), COUNT(*) FROM orders');
    console.log('\nOverall order data range:', result.rows[0]);
    
    // Check what would be deleted
    const deleteCheck = await client.query(`
      SELECT COUNT(*) as count_to_delete,
             MIN(created_at) as oldest_to_delete,
             MAX(created_at) as newest_to_delete
      FROM orders 
      WHERE created_at < $1
    `, [cutoffDate]);
    
    const deleteInfo = deleteCheck.rows[0];
    console.log('\nOrders that would be deleted:', deleteInfo);
    
    // Check what would be kept
    const keepCheck = await client.query(`
      SELECT COUNT(*) as count_to_keep,
             MIN(created_at) as oldest_to_keep,
             MAX(created_at) as newest_to_keep
      FROM orders 
      WHERE created_at >= $1
    `, [cutoffDate]);
    
    const keepInfo = keepCheck.rows[0];
    console.log('Orders that would be kept:', keepInfo);
    
    // Show sample orders that would be deleted
    const sampleDelete = await client.query(`
      SELECT order_id, created_at, total_amount
      FROM orders 
      WHERE created_at < $1
      ORDER BY created_at ASC
      LIMIT 5
    `, [cutoffDate]);
    
    if (sampleDelete.rows.length > 0) {
      console.log('\nSample orders to be deleted:');
      sampleDelete.rows.forEach(order => {
        console.log(`  Order ${order.order_id}: ${order.created_at} - ₱${order.total_amount}`);
      });
    }
    
  } finally {
    client.release();
    process.exit(0);
  }
}

checkOrderDates().catch(console.error);
