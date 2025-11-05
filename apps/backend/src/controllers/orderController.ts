import { Request, Response } from 'express';
import pool from '../config/db';

export const createOrder = async (req: Request, res: Response) => {
  const { order_items } = req.body;

  if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
    return res.status(400).json({ success: false, error: 'Order items are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      'INSERT INTO "orders" (price, is_cancelled, is_completed, is_kitchen_made, is_kitchen_completed, staff_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING order_id',
      [0, false, false, false, false, 1] // Default values for a new order
    );
    const orderId = orderResult.rows[0].order_id;

    for (const item of order_items) {
      const mealResult = await client.query(
        'INSERT INTO "meals" (order_id, meal_type_id) VALUES ($1, $2) RETURNING meal_id',
        [orderId, item.mealType.meal_type_id]
      );
      const mealId = mealResult.rows[0].meal_id;

      for (const entree of item.entrees) {
        await client.query(
          'INSERT INTO "meal_details" (meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4)',
          [mealId, item.mealType.meal_type_id, entree.menu_item_id, 'entree']
        );
      }

      for (const side of item.sides) {
        await client.query(
          'INSERT INTO "meal_details" (meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4)',
          [mealId, item.mealType.meal_type_id, side.menu_item_id, 'side']
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { orderId } });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};
