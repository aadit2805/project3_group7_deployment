import { Pool } from 'pg';

const pool = new Pool();

export const testConnection = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed', error);
  }
};

export default pool;
