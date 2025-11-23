import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';

const router = Router();

/**
 * Example routes using Prisma Client with your production database schema
 * These routes demonstrate how to use Prisma instead of raw SQL queries.
 * All queries are type-safe and provide autocomplete in your IDE.
 */

// GET /api/prisma/menu-items - Get all menu items
router.get('/menu-items', async (_req: Request, res: Response) => {
  try {
    const menuItems = await prisma.menu_items.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: menuItems });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

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

// GET /api/prisma/menu-items/available - Get only available menu items
router.get('/menu-items/available', async (_req: Request, res: Response) => {
  try {
    const availableItems = await prisma.menu_items.findMany({
      where: { is_available: true },
      orderBy: { name: 'asc' },
    });
    // Filter by time-based availability
    const filteredItems = availableItems.filter((item) =>
      isWithinAvailabilityWindow(item.availability_start_time, item.availability_end_time)
    );
    return res.json({ success: true, data: filteredItems });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/prisma/menu-items/:id - Get a specific menu item
router.get('/menu-items/:id', async (req: Request, res: Response) => {
  try {
    const menuItemId = parseInt(req.params.id);
    const menuItem = await prisma.menu_items.findUnique({
      where: { menu_item_id: menuItemId },
      include: {
        inventory: true, // Include inventory information
      },
    });

    if (!menuItem) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    return res.json({ success: true, data: menuItem });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/prisma/meal-types - Get all meal types with pricing
router.get('/meal-types', async (_req: Request, res: Response) => {
  try {
    const mealTypes = await prisma.meal_types.findMany({
      orderBy: { meal_type_price: 'asc' },
    });
    return res.json({ success: true, data: mealTypes });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/prisma/orders/recent - Get recent orders with details
router.get('/orders/recent', async (_req: Request, res: Response) => {
  try {
    const recentOrders = await prisma.order.findMany({
      take: 10, // Limit to 10 orders
      orderBy: { datetime: 'desc' },
      include: {
        staff: {
          select: {
            username: true,
            staff_id: true,
          },
        },
        payment: true,
        meal: {
          include: {
            meal_types: true,
          },
        },
      },
    });
    return res.json({ success: true, data: recentOrders });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/prisma/staff/:id/orders - Get orders for a specific staff member
router.get('/staff/:id/orders', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const orders = await prisma.order.findMany({
      where: { staff_id: staffId },
      orderBy: { datetime: 'desc' },
      include: {
        payment: true,
        meal: true,
      },
    });
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/prisma/inventory/low-stock - Get items that need reordering
router.get('/inventory/low-stock', async (_req: Request, res: Response) => {
  try {
    const lowStockItems = await prisma.inventory.findMany({
      where: { reorder: true },
      include: {
        menu_items: true,
      },
      orderBy: { stock: 'asc' },
    });
    return res.json({ success: true, data: lowStockItems });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/prisma/daily-summaries/recent - Get recent daily summaries
router.get('/daily-summaries/recent', async (_req: Request, res: Response) => {
  try {
    const summaries = await prisma.dailysummaries.findMany({
      take: 7, // Last 7 days
      orderBy: { business_date: 'desc' },
    });
    return res.json({ success: true, data: summaries });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/prisma/menu-items - Create a new menu item (example)
router.post('/menu-items', async (req: Request, res: Response) => {
  try {
    const { name, upcharge, is_available, item_type } = req.body;

    if (!name || !item_type) {
      return res.status(400).json({
        success: false,
        error: 'Name and item_type are required',
      });
    }

    // Get the next available menu_item_id
    const lastItem = await prisma.menu_items.findFirst({
      orderBy: { menu_item_id: 'desc' },
    });
    const newId = (lastItem?.menu_item_id || 0) + 1;

    const { availability_start_time, availability_end_time } = req.body;
    const newItem = await prisma.menu_items.create({
      data: {
        menu_item_id: newId,
        name,
        upcharge: upcharge || 0,
        is_available: is_available !== undefined ? is_available : true,
        item_type,
        availability_start_time: availability_start_time || null,
        availability_end_time: availability_end_time || null,
      },
    });

    return res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PATCH /api/prisma/menu-items/:id/availability - Update menu item availability
router.patch('/menu-items/:id/availability', async (req: Request, res: Response) => {
  try {
    const menuItemId = parseInt(req.params.id);
    const { is_available, availability_start_time, availability_end_time } = req.body;

    if (typeof is_available !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_available must be a boolean',
      });
    }

    const updateData: any = { is_available };
    if (availability_start_time !== undefined) {
      updateData.availability_start_time = availability_start_time || null;
    }
    if (availability_end_time !== undefined) {
      updateData.availability_end_time = availability_end_time || null;
    }

    const updatedItem = await prisma.menu_items.update({
      where: { menu_item_id: menuItemId },
      data: updateData,
    });

    return res.json({ success: true, data: updatedItem });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
