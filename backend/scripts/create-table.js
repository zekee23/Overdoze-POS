import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createMonthlyReportsTable() {
  try {
    console.log('Creating monthly_reports table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'create_monthly_reports_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ monthly_reports table created successfully!');
    
    // Verify the table was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'monthly_reports'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table verification successful!');
    } else {
      console.log('❌ Table was not created');
    }
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createMonthlyReportsTable();
