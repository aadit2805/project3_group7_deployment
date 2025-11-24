import { Request, Response } from 'express';
import pool from '../config/db';
import prisma from '../config/prisma'; // Import centralized Prisma instance

// Cache for rush orders and order notes (in-memory storage)
const rushOrderCache = new Map<number, boolean>();
const orderNotesCache = new Map<number, string>();

export const createOrder = async (req: Request, res: Response) => {
  const { order_items, customer_name, rush_order, order_notes, customerId, pointsApplied } = req.body; // Added customer_name, rush_order, order_notes, customerId, pointsApplied

  if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
    return res.status(400).json({ success: false, error: 'Order items are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    let currentCustomerPoints = 0; // Initialize for point validation
    const POINTS_PER_DOLLAR = 25; // Must match frontend logic

    // If points are applied, fetch customer's current points and validate
    if (customerId && pointsApplied && pointsApplied > 0) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { rewards_points: true },
      });

      if (!customer) {
        throw new Error('Customer not found for point application.');
      }
      currentCustomerPoints = customer.rewards_points;

      if (pointsApplied > currentCustomerPoints) {
        throw new Error('Not enough points to apply.');
      }
    }

    // Fetch all menu items and meal types for price lookup
    const menuItemsResult = await client.query('SELECT menu_item_id, upcharge FROM menu_items');
    const menuItemsMap = new Map(
      menuItemsResult.rows.map((item) => [item.menu_item_id, item.upcharge])
    );

    const mealTypesResult = await client.query(
      'SELECT meal_type_id, meal_type_price FROM meal_types'
    );
    const mealTypesMap = new Map(
      mealTypesResult.rows.map((type) => [type.meal_type_id, type.meal_type_price])
    );

    const maxIdResult = await client.query('SELECT MAX(order_id) as max_id FROM "Order"');
    const maxId = maxIdResult.rows[0].max_id;
    const newOrderId = (maxId === null ? 0 : maxId) + 1;

    // Insert order with a temporary price (0) and customerId
    const orderResult = await client.query(
      'INSERT INTO "Order" (order_id, price, order_status, staff_id, datetime, customer_name, "customerId") VALUES ($1, $2, $3, $4, NOW(), $5, $6) RETURNING order_id',
      [newOrderId, 0, 'pending', 1, customer_name || null, customerId || null] // Added customer_name and customerId
    );
    const orderId = orderResult.rows[0].order_id;

    if (rush_order === true) {
      rushOrderCache.set(orderId, true);
    }

    if (order_notes && typeof order_notes === 'string' && order_notes.trim()) {
      orderNotesCache.set(orderId, order_notes.trim());
    }

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
    
    // Calculate final price after point deduction
    let finalPrice = totalPrice;
    if (pointsApplied && pointsApplied > 0) {
        const discountValue = pointsApplied / POINTS_PER_DOLLAR;
        finalPrice = Math.max(0, totalPrice - discountValue); // Ensure price doesn't go below 0
    }

    // Update the order with the calculated final price
    await client.query('UPDATE "Order" SET price = $1 WHERE order_id = $2', [finalPrice, orderId]);

    // Deduct points from customer and award new points (if applicable)
    if (customerId) {
        // Deduct applied points first
        if (pointsApplied && pointsApplied > 0) {
            await prisma.customer.update({
                where: { id: customerId },
                data: { rewards_points: { decrement: pointsApplied } },
            });
        }
        
        // Award new points based on final price after discount
        const pointsEarned = Math.floor(finalPrice); // Example: 1 point per dollar spent on final price
        await prisma.customer.update({
            where: { id: customerId },
            data: { rewards_points: { increment: pointsEarned } },
        });
    }

    await client.query('COMMIT'); // Commit transaction

    return res.status(201).json({ success: true, data: { orderId, totalPrice: finalPrice } });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

export const getActiveOrders = async (_req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    // Get all orders that are not addressed or cancelled
    const result = await client.query(
      `SELECT 
        o.order_id,
        o.staff_id,
        o.datetime,
        o.price,
        o.order_status,
        s.username as staff_username,
        COUNT(DISTINCT m.meal_id) as meal_count
      FROM "Order" o
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN meal m ON o.order_id = m.order_id
      WHERE (o.order_status IS NULL OR o.order_status NOT IN ('addressed', 'cancelled'))
      GROUP BY o.order_id, o.staff_id, o.datetime, o.price, o.order_status, s.username
      ORDER BY o.datetime DESC NULLS LAST, o.order_id DESC`
    );

    return res.status(200).json({
      success: true,
      data: result.rows.map((row) => ({
        order_id: row.order_id,
        staff_id: row.staff_id,
        staff_username: row.staff_username,
        datetime: row.datetime,
        price: row.price ? parseFloat(row.price) : 0,
        order_status: row.order_status || 'pending',
        meal_count: parseInt(row.meal_count) || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

export const getKitchenOrders = async (_req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    // Get all orders that are not completed, addressed, or cancelled, with full details
    // Kitchen Monitor should only show orders that are still being prepared
    const ordersResult = await client.query(
      `SELECT 
        o.order_id,
        o.customer_name,
        o.datetime,
        o.order_status,
        s.username as staff_username
      FROM "Order" o
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      WHERE (o.order_status IS NULL OR o.order_status NOT IN ('completed', 'addressed', 'cancelled'))
      ORDER BY o.datetime ASC NULLS FIRST, o.order_id ASC`
    );

    const orders = [];

    for (const orderRow of ordersResult.rows) {
      // Get all meals for this order
      const mealsResult = await client.query(
        `SELECT 
          m.meal_id,
          mt.meal_type_name,
          mt.meal_type_id
        FROM meal m
        LEFT JOIN meal_types mt ON m.meal_type_id = mt.meal_type_id
        WHERE m.order_id = $1`,
        [orderRow.order_id]
      );

      const meals = [];

      for (const mealRow of mealsResult.rows) {
        // Get all items for this meal
        const itemsResult = await client.query(
          `SELECT 
            md.role,
            mi.name,
            mi.menu_item_id
          FROM meal_detail md
          LEFT JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
          WHERE md.meal_id = $1
          ORDER BY md.role, mi.name`,
          [mealRow.meal_id]
        );

        meals.push({
          meal_id: mealRow.meal_id,
          meal_type_name: mealRow.meal_type_name,
          items: itemsResult.rows.map((item) => ({
            name: item.name,
            role: item.role,
          })),
        });
      }

      const isRushOrder = rushOrderCache.get(orderRow.order_id) || false;
      const orderNotes = orderNotesCache.get(orderRow.order_id) || null;

      orders.push({
        order_id: orderRow.order_id,
        customer_name: orderRow.customer_name || 'Guest',
        datetime: orderRow.datetime,
        order_status: orderRow.order_status || 'pending',
        staff_username: orderRow.staff_username,
        rush_order: isRushOrder,
        order_notes: orderNotes,
        meals,
      });
    }

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update order status and set completed_at if status is 'completed'
    let updateQuery = 'UPDATE "Order" SET order_status = $1';
    const queryParams: any[] = [status];

    if (status === 'completed') {
      // Check if completed_at is not already set (to avoid overwriting)
      updateQuery += ', completed_at = COALESCE(completed_at, NOW())';
    }

    updateQuery += ' WHERE order_id = $2 RETURNING *';
    queryParams.push(orderId);

    const result = await client.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // If marking as completed, decrement inventory
    if (status === 'completed') {
      // Get all menu items from this order
      const menuItemsResult = await client.query(
        `SELECT md.menu_item_id, COUNT(*) as quantity
         FROM meal m
         JOIN meal_detail md ON m.meal_id = md.meal_id
         WHERE m.order_id = $1 AND md.menu_item_id IS NOT NULL
         GROUP BY md.menu_item_id`,
        [orderId]
      );

      // Decrement inventory for each menu item
      for (const item of menuItemsResult.rows) {
        const menuItemId = item.menu_item_id;
        const quantity = parseInt(item.quantity);

        // Update inventory stock (decrement by quantity used)
        await client.query(
          `UPDATE inventory 
           SET stock = stock - $1 
           WHERE menu_item_id = $2 AND stock >= $1`,
          [quantity, menuItemId]
        );

        await client.query(
          `UPDATE inventory 
           SET reorder = true 
           WHERE menu_item_id = $1 AND stock < 10`,
          [menuItemId]
        );
      }
    }

    await client.query('COMMIT');

    if (status === 'completed' || status === 'addressed') {
      rushOrderCache.delete(parseInt(orderId));
      orderNotesCache.delete(parseInt(orderId));
    }

    return res.status(200).json({
      success: true,
      data: {
        order_id: result.rows[0].order_id,
        order_status: result.rows[0].order_status,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

export const getCustomerOrders = async (req: Request, res: Response) => {
  const customerId = req.customer?.id; // Get customer ID from authenticated request

  if (!customerId) {
    return res.status(401).json({ success: false, error: 'Customer not authenticated' });
  }

  const client = await pool.connect();

  try {
    const ordersResult = await client.query(
      `SELECT
        o.order_id,
        o.datetime AS order_date,
        o.price AS total_price,
        o."customerId",
        (o.price / 1) AS points_earned -- Assuming 1 point per dollar for now, adjust as needed
      FROM "Order" o
      WHERE o."customerId" = $1
      ORDER BY o.datetime DESC`,
      [customerId]
    );

    const orders = [];

    for (const orderRow of ordersResult.rows) {
      const mealsResult = await client.query(
        `SELECT
          m.meal_id,
          mt.meal_type_name,
          mt.meal_type_id
        FROM meal m
        LEFT JOIN meal_types mt ON m.meal_type_id = mt.meal_type_id
        WHERE m.order_id = $1
        ORDER BY m.meal_id`,
        [orderRow.order_id]
      );

      const orderItems = [];

      for (const mealRow of mealsResult.rows) {
        const itemsResult = await client.query(
          `SELECT
            md.role,
            mi.name
          FROM meal_detail md
          LEFT JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
          WHERE md.meal_id = $1
          ORDER BY md.role, mi.name`,
          [mealRow.meal_id]
        );

        const entrees = itemsResult.rows.filter(item => item.role === 'entree').map(item => ({ name: item.name }));
        const sides = itemsResult.rows.filter(item => item.role === 'side').map(item => ({ name: item.name }));
        const drink = itemsResult.rows.find(item => item.role === 'drink'); // Assuming one drink per meal

        orderItems.push({
          mealType: {
            meal_type_name: mealRow.meal_type_name,
            meal_type_id: mealRow.meal_type_id,
          },
          entrees,
          sides,
          drink: drink ? { name: drink.name } : undefined,
        });
      }

      orders.push({
        order_id: orderRow.order_id,
        order_date: orderRow.order_date,
        total_price: parseFloat(orderRow.total_price),
        points_earned: parseInt(orderRow.points_earned),
        order_items: orderItems,
      });
    }

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};


export const getPreparedOrders = async (_req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    // Get all orders with status 'completed' (prepared but not yet addressed)
    const result = await client.query(
      `SELECT 
        o.order_id,
        o.customer_name,
        o.datetime,
        o.order_status,
        o.completed_at
      FROM "Order" o
      WHERE o.order_status = 'completed'
      ORDER BY o.completed_at ASC NULLS LAST, o.order_id ASC`
    );

    return res.status(200).json({
      success: true,
      data: result.rows.map((row) => ({
        order_id: row.order_id,
        customer_name: row.customer_name || 'Guest',
        datetime: row.datetime,
        completed_at: row.completed_at,
        order_status: row.order_status,
      })),
    });
  } catch (error) {
    console.error('Error fetching prepared orders:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

export const markOrderAddressed = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update order status to 'addressed'
    const result = await client.query(
      `UPDATE "Order" 
       SET order_status = 'addressed' 
       WHERE order_id = $1 AND order_status = 'completed'
       RETURNING *`,
      [orderId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found or not in completed status' 
      });
    }

    await client.query('COMMIT');

    rushOrderCache.delete(parseInt(orderId));
    orderNotesCache.delete(parseInt(orderId));

    return res.status(200).json({
      success: true,
      data: {
        order_id: result.rows[0].order_id,
        order_status: result.rows[0].order_status,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking order as addressed:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};