import { Router } from 'express';
import {
  getInventory,
  getLowStock,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getMenuItems,
  addFoodItemWithMenuItem,
  getRestockReport, // Import the new controller function
} from '../controllers/inventoryController';

const router = Router();

router.get('/', getInventory);
router.get('/low-stock', getLowStock);
router.get('/restock-report', getRestockReport); // Add the new route
router.post('/', addInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);
router.get('/menu-items', getMenuItems);
router.post('/food-with-menu-item', addFoodItemWithMenuItem);

export default router;
