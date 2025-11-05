
import { Pool } from 'pg';

const pool = new Pool({
  user: 'group_7',
  host: 'csce-315-db.engr.tamu.edu',
  database: 'group_7_db',
  password: '!teamIndia_tidaa',
  port: 5432,
});

export default pool;
