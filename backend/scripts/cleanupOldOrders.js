import cron from 'node-cron';
import pool from '../config/db.js';

const cleanupOldOrders = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting automatic cleanup of orders older than 2 months...');
    
    await client.query('BEGIN');

    // Delete orders older than 2 months
    const deleteResult = await client.query(`
      DELETE FROM orders 
      WHERE created_at < NOW() - INTERVAL '2 months'
      RETURNING order_id
    `);

    const deletedCount = deleteResult.rowCount;

    await client.query('COMMIT');

    console.log(`Successfully deleted ${deletedCount} orders older than 2 months`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('AUTO CLEANUP ERROR:', err);
  } finally {
    client.release();
  }
};

// Schedule the cleanup job to run daily at 2:00 AM
cron.schedule('0 2 * * *', cleanupOldOrders);

console.log('Order cleanup scheduler initialized - runs daily at 2:00 AM');

export default cleanupOldOrders;
