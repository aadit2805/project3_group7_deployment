
import express from 'express';
import pool from './db';
import cors from 'cors';

const app = express();
app.use(cors());
const port = process.env.PORT || 3001;



app.get('/api/meal-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM meal_types WHERE meal_type_id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Meal type not found' });
    }
  } catch (err) {
    console.error('Error fetching meal type by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/meal-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meal_types');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/menu-items', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM menu_items';
    const params = [];
    if (type) {
      query += ' WHERE item_type = $1';
      params.push(type as string);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
