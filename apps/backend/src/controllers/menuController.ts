import { Request, Response } from 'express';
import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'group_7_db',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// TypeScript interface matching the database schema
interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
}

// Get all menu items
export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    let query = 'SELECT menu_item_id, name, upcharge, is_available, item_type FROM menu_items';
    const queryParams: (string | boolean)[] = [];

    if (req.query.is_available === 'true') {
      query += ' WHERE is_available = $1';
      queryParams.push(true);
    }

    query += ' ORDER BY menu_item_id';

    const result = await pool.query<MenuItem>(query, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      error: 'Failed to retrieve menu items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get menu items filtered by availability
export const getAvailableMenuItems = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type FROM menu_items WHERE is_available = true ORDER BY menu_item_id'
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching available menu items:', error);
    res.status(500).json({
      error: 'Failed to retrieve available menu items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get menu items by type
export const getMenuItemsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const result = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type FROM menu_items WHERE item_type = $1 ORDER BY menu_item_id',
      [type]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items by type:', error);
    res.status(500).json({
      error: 'Failed to retrieve menu items by type',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get single menu item by ID
export const getMenuItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type FROM menu_items WHERE menu_item_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching menu item by ID:', error);
    res.status(500).json({
      error: 'Failed to retrieve menu item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get menu items with inventory information
export const getMenuItemsWithInventory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT 
        m.menu_item_id, 
        m.name, 
        m.upcharge, 
        m.is_available, 
        m.item_type,
        i.stock,
        i.reorder
      FROM menu_items m
      LEFT JOIN inventory i ON m.menu_item_id = i.menu_item_id
      ORDER BY m.menu_item_id`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items with inventory:', error);
    res.status(500).json({
      error: 'Failed to retrieve menu items with inventory',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getMealTypes = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM meal_types');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMealTypeById = async (req: Request, res: Response) => {
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
};
