import { Request, Response } from 'express';
import { db } from '../db';

export const getInventory = async (_req: Request, res: Response) => {
  try {
    const inventory = await db.inventory.findMany({
      include: {
        menu_items: true,
      },
    });
    const nonFoodInventory = await db.non_food_inventory.findMany();
    res.json({ food: inventory, non_food: nonFoodInventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

export const getLowStock = async (_req: Request, res: Response) => {
  try {
    const food_inventory = await db.inventory.findMany({
      where: {
        reorder: true,
      },
      include: {
        menu_items: true,
      },
    });

    const non_food_inventory = await db.non_food_inventory.findMany({
      where: {
        reorder: true,
      },
    });
    res.json({ food: food_inventory, non_food: non_food_inventory });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

export const getRestockReport = async (_req: Request, res: Response) => {
  try {
    const lowFoodStock = await db.inventory.findMany({
      where: {
        stock: {
          lt: 20,
        },
      },
      include: {
        menu_items: true,
      },
    });

    const lowNonFoodStock = await db.non_food_inventory.findMany({
      where: {
        stock: {
          lt: 80,
        },
      },
    });

    res.json({ food: lowFoodStock, non_food: lowNonFoodStock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

export const addInventoryItem = async (req: Request, res: Response) => {
  try {
    const { is_food, ...data } = req.body;
    if (is_food) {
      const { menu_item_id, stock, reorder, storage } = data;
      const maxId = await db.inventory.aggregate({ _max: { inventory_id: true } });
      const newId = (maxId._max.inventory_id || 0) + 1;
      const item = await db.inventory.create({
        data: { inventory_id: newId, menu_item_id, stock, reorder, storage },
      });
      res.json(item);
    } else {
      const { name, stock, reorder } = data;
      const maxId = await db.non_food_inventory.aggregate({ _max: { supply_id: true } });
      const newId = (maxId._max.supply_id || 0) + 1;
      const item = await db.non_food_inventory.create({
        data: { supply_id: newId, name, stock, reorder },
      });
      res.json(item);
    }
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_food, ...data } = req.body;

    if (is_food) {
      const { stock, reorder, storage } = data;

      const parsedStock = Number(stock);
      const parsedReorder = reorder === 'true' || reorder === 'on'; // Handle both boolean and string 'on'

      // Update the inventory item
      const inventoryItem = await db.inventory.update({
        where: { inventory_id: Number(id) },
        data: { stock: parsedStock, reorder: parsedReorder, storage },
      });

      return res.json({ inventoryItem });
    } else {
      const { stock, reorder } = data;

      const parsedStock = Number(stock);
      const parsedReorder = reorder === 'true' || reorder === 'on';

      const item = await db.non_food_inventory.update({
        where: { supply_id: Number(id) },
        data: { stock: parsedStock, reorder: parsedReorder },
      });
      return res.json(item); // Added return
    }
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({ error: 'Something went wrong' }); // Added return
  }
};

export const getMenuItems = async (_req: Request, res: Response) => {
  try {
    const menuItems = await db.menu_items.findMany();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

export const addFoodItemWithMenuItem = async (req: Request, res: Response) => {
  try {
    const { name, stock, reorder, storage, upcharge, is_available, item_type } = req.body;

    const maxMenuItemId = await db.menu_items.aggregate({ _max: { menu_item_id: true } });
    const newMenuItemId = (maxMenuItemId._max.menu_item_id || 0) + 1;

    const menuItem = await db.menu_items.create({
      data: {
        menu_item_id: newMenuItemId,
        name,
        upcharge,
        is_available,
        item_type,
      },
    });

    const maxInventoryId = await db.inventory.aggregate({ _max: { inventory_id: true } });
    const newInventoryId = (maxInventoryId._max.inventory_id || 0) + 1;

    const inventoryItem = await db.inventory.create({
      data: {
        inventory_id: newInventoryId,
        menu_item_id: menuItem.menu_item_id,
        stock,
        reorder,
        storage,
      },
    });

    res.json({ menuItem, inventoryItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
