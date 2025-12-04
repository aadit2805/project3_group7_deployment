import { Request, Response } from 'express';
import pool from '../config/db';
import { createAuditLog } from '../services/auditService';

// TypeScript interface matching the database schema
interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
  availability_start_time?: string | null;
  availability_end_time?: string | null;
}

// Helper function to check if current time is within availability window
function isWithinAvailabilityWindow(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): boolean {
  // If no time restrictions are set, always available
  if (!startTime || !endTime) {
    return true;
  }

  // Parse time strings (HH:mm:ss format from DB or HH:mm from input)
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes; // Convert to minutes since midnight
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);

  // Handle midnight crossing (e.g., 22:00 to 02:00)
  if (startMinutes > endMinutes) {
    // Window crosses midnight (e.g., 22:00 to 02:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  } else {
    // Normal window within same day (e.g., 08:00 to 18:00)
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}

// Helper function to filter menu items by time-based availability
function filterByTimeAvailability(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => {
    // If is_available is false, item is not available regardless of time
    if (!item.is_available) {
      return false;
    }

    // Check time-based availability
    return isWithinAvailabilityWindow(
      item.availability_start_time,
      item.availability_end_time
    );
  });
}

// Get all menu items
export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    let query =
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time FROM menu_items';
    const queryParams: (string | boolean)[] = [];

    if (req.query.is_available === 'true') {
      query += ' WHERE is_available = $1';
      queryParams.push(true);
    }

    query += ' ORDER BY menu_item_id';

    const result = await pool.query<MenuItem>(query, queryParams);
    let items = result.rows;

    // If filtering by availability, also filter by time-based availability
    if (req.query.is_available === 'true') {
      items = filterByTimeAvailability(items);
    }

    res.status(200).json(items);
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
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time FROM menu_items WHERE is_available = true ORDER BY menu_item_id'
    );
    // Filter by time-based availability
    const filteredItems = filterByTimeAvailability(result.rows);
    res.status(200).json(filteredItems);
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
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time FROM menu_items WHERE item_type = $1 ORDER BY menu_item_id',
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
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time FROM menu_items WHERE menu_item_id = $1',
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
        m.availability_start_time,
        m.availability_end_time,
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

// Create a new menu item
export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      upcharge,
      is_available,
      item_type,
      menu_item_id,
      stock,
      reorder,
      storage,
      availability_start_time,
      availability_end_time,
    } = req.body;

    // Validation
    if (!name || !item_type || stock === undefined || reorder === undefined || !storage) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, item_type, stock, reorder, and storage are required',
      });
      return;
    }

    // Validate item_type
    const validTypes = ['entree', 'side', 'drink'];
    if (!validTypes.includes(item_type.toLowerCase())) {
      res.status(400).json({
        error: 'Invalid item_type',
        message: `item_type must be one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    // Get next menu_item_id if not provided
    let itemId = menu_item_id;
    if (!itemId) {
      const maxIdResult = await pool.query(
        'SELECT COALESCE(MAX(menu_item_id), 0) + 1 as next_id FROM menu_items'
      );
      itemId = maxIdResult.rows[0].next_id;
    } else {
      // Check if ID already exists
      const existingResult = await pool.query(
        'SELECT menu_item_id FROM menu_items WHERE menu_item_id = $1',
        [itemId]
      );
      if (existingResult.rows.length > 0) {
        res.status(409).json({
          error: 'Menu item ID already exists',
          message: `Menu item with ID ${itemId} already exists`,
        });
        return;
      }
    }

    // Insert new menu item
    const result = await pool.query<MenuItem>(
      `INSERT INTO menu_items (menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time`,
      [
        itemId,
        name,
        upcharge || 0,
        is_available !== undefined ? is_available : true,
        item_type.toLowerCase(),
        availability_start_time || null,
        availability_end_time || null,
      ]
    );

    const newMenuItem = result.rows[0];

    // Create corresponding entry in inventory table
    const maxInventoryIdResult = await pool.query(
      'SELECT COALESCE(MAX(inventory_id), 0) + 1 as next_id FROM inventory'
    );
    const newInventoryId = maxInventoryIdResult.rows[0].next_id;

    await pool.query(
      `INSERT INTO inventory (inventory_id, menu_item_id, stock, reorder, storage)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        newInventoryId,
        newMenuItem.menu_item_id,
        stock,
        reorder,
        storage,
      ]
    );

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'CREATE',
      entity_type: 'menu_item',
      entity_id: String(newMenuItem.menu_item_id),
      new_values: newMenuItem,
      description: `Created menu item: ${name} (ID: ${newMenuItem.menu_item_id})`,
    });

    res.status(201).json({
      success: true,
      message: 'Menu item and inventory item created successfully',
      data: newMenuItem,
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      error: 'Failed to create menu item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update a menu item
export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      upcharge,
      is_available,
      item_type,
      availability_start_time,
      availability_end_time,
    } = req.body;

    // Get old values for audit log
    const oldItemResult = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time FROM menu_items WHERE menu_item_id = $1',
      [id]
    );

    if (oldItemResult.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    const oldMenuItem = oldItemResult.rows[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (upcharge !== undefined) {
      updates.push(`upcharge = $${paramCount++}`);
      values.push(upcharge);
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(is_available);
    }
    if (item_type !== undefined) {
      const validTypes = ['entree', 'side', 'drink'];
      if (!validTypes.includes(item_type.toLowerCase())) {
        res.status(400).json({
          error: 'Invalid item_type',
          message: `item_type must be one of: ${validTypes.join(', ')}`,
        });
        return;
      }
      updates.push(`item_type = $${paramCount++}`);
      values.push(item_type.toLowerCase());
    }
    if (availability_start_time !== undefined) {
      updates.push(`availability_start_time = $${paramCount++}`);
      values.push(availability_start_time || null);
    }
    if (availability_end_time !== undefined) {
      updates.push(`availability_end_time = $${paramCount++}`);
      values.push(availability_end_time || null);
    }

    if (updates.length === 0) {
      res.status(400).json({
        error: 'No fields to update',
        message: 'Provide at least one field to update',
      });
      return;
    }

    values.push(id);
    const result = await pool.query<MenuItem>(
      `UPDATE menu_items 
       SET ${updates.join(', ')}
       WHERE menu_item_id = $${paramCount}
       RETURNING menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    const updatedMenuItem = result.rows[0];

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'UPDATE',
      entity_type: 'menu_item',
      entity_id: String(id),
      old_values: oldMenuItem,
      new_values: updatedMenuItem,
      description: `Updated menu item: ${updatedMenuItem.name} (ID: ${id})`,
    });

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedMenuItem,
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      error: 'Failed to update menu item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Deactivate a menu item (set is_available to false)
export const deactivateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get old values for audit log
    const oldItemResult = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time FROM menu_items WHERE menu_item_id = $1',
      [id]
    );

    if (oldItemResult.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    const oldMenuItem = oldItemResult.rows[0];

    const result = await pool.query(
      'UPDATE menu_items SET is_available = false WHERE menu_item_id = $1 RETURNING menu_item_id, is_available, name',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'DEACTIVATE',
      entity_type: 'menu_item',
      entity_id: String(id),
      old_values: oldMenuItem,
      new_values: { ...oldMenuItem, is_available: false },
      description: `Deactivated menu item: ${oldMenuItem.name} (ID: ${id})`,
    });

    res.status(200).json({
      success: true,
      message: 'Menu item deactivated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deactivating menu item:', error);
    res.status(500).json({
      error: 'Failed to deactivate menu item',
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
