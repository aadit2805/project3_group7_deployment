import { Request, Response } from 'express';
import pool from '../config/db';

export const createOrder = async (req: Request, res: Response) => {
  const { order_items, customer_name } = req.body; // Added customer_name

  if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
    return res.status(400).json({ success: false, error: 'Order items are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    // Fetch all menu items and meal types for price lookup
    const menuItemsResult = await client.query('SELECT menu_item_id, upcharge FROM menu_items');
    const menuItemsMap = new Map(menuItemsResult.rows.map((item) => [item.menu_item_id, item.upcharge]));

    const mealTypesResult = await client.query(
      'SELECT meal_type_id, meal_type_price FROM meal_types'
    );
    const mealTypesMap = new Map(
      mealTypesResult.rows.map((type) => [type.meal_type_id, type.meal_type_price])
    );

    const maxIdResult = await client.query('SELECT MAX(order_id) as max_id FROM "Order"');
    const maxId = maxIdResult.rows[0].max_id;
    const newOrderId = (maxId === null ? 0 : maxId) + 1;

    // Insert order with a temporary price (0)
    const orderResult = await client.query(
      'INSERT INTO "Order" (order_id, price, order_status, staff_id, datetime, customer_name) VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING order_id',
      [newOrderId, 0, 'pending', 1, customer_name || null] // Added customer_name
    );
    const orderId = orderResult.rows[0].order_id;

    let totalPrice = 0; // Initialize total price

    const maxMealIdResult = await client.query('SELECT MAX(meal_id) as max_id FROM "meal"');
    let nextMealId =
      (maxMealIdResult.rows[0].max_id === null ? 0 : maxMealIdResult.rows[0].max_id) + 1;

    const maxDetailIdResult = await client.query(
      'SELECT MAX(detail_id) as max_id FROM "meal_detail"'
    );
    let nextDetailId =
      (maxDetailIdResult.rows[0].max_id === null ? 0 : maxDetailIdResult.rows[0].max_id) + 1;

    for (const item of order_items) {
      const mealPrice = mealTypesMap.get(item.mealType.meal_type_id) || 0;
      totalPrice += mealPrice;

      const mealResult = await client.query(
        'INSERT INTO "meal" (meal_id, order_id, meal_type_id) VALUES ($1, $2, $3) RETURNING meal_id',
        [nextMealId, orderId, item.mealType.meal_type_id]
      );
      const mealId = mealResult.rows[0].meal_id;

      for (const entree of item.entrees) {
        const entreeUpcharge = menuItemsMap.get(entree.menu_item_id) || 0;
        totalPrice += entreeUpcharge;

        await client.query(
          'INSERT INTO "meal_detail" (detail_id, meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4, $5)',
          [nextDetailId, mealId, item.mealType.meal_type_id, entree.menu_item_id, 'entree']
        );
        nextDetailId++;
      }

      for (const side of item.sides) {
        const sideUpcharge = menuItemsMap.get(side.menu_item_id) || 0;
        totalPrice += sideUpcharge;

        await client.query(
          'INSERT INTO "meal_detail" (detail_id, meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4, $5)',
          [nextDetailId, mealId, item.mealType.meal_type_id, side.menu_item_id, 'side']
        );
        nextDetailId++;
      }
      nextMealId++;
    }

    // Update the order with the calculated total price
    await client.query('UPDATE "Order" SET price = $1 WHERE order_id = $2', [totalPrice, orderId]);

    await client.query('COMMIT'); // Commit transaction

    return res.status(201).json({ success: true, data: { orderId, totalPrice } });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};
