import { Router, Request, Response } from 'express';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deactivateMenuItem,
  getMealTypes,
  getMealTypeById,
} from '../controllers/menuController';
import {
  createOrder,
  getActiveOrders,
  getKitchenOrders,
  updateOrderStatus,
} from '../controllers/orderController';
import {
  getDailyRevenueReport,
  getOrdersByDate,
  getRevenueSummary,
  exportRevenueReportCSV,
} from '../controllers/revenueController';
import {
  getAverageCompletionTime,
  getHourlyCompletionTime,
  getCompletionTimeSummary,
} from '../controllers/orderAnalyticsController';
import {
  getBestSellingItems,
  getSalesByCategory,
  getSalesTrends,
  getSalesSummary,
} from '../controllers/salesAnalyticsController';
import { ApiResponse } from '../types';
import pool from '../config/db';
import translationRoutes from './translation.routes';
import weatherRoutes from './weather.routes';
import inventoryRoutes from './inventory.routes';
import { isAuthenticated, isManager, isCashierOrManager } from '../middleware/auth';
import axios from 'axios';

const router = Router();

// Inventory routes
router.use('/inventory', inventoryRoutes);

// GET /api/menu-items
router.get('/menu-items', getMenuItems);

// Manager-only routes for menu items
router.post('/menu-items', isAuthenticated, isManager, createMenuItem);
router.put('/menu-items/:id', isAuthenticated, isManager, updateMenuItem);
router.put('/menu-items/:id/deactivate', isAuthenticated, isManager, deactivateMenuItem);

// POST /api/orders
router.post('/orders', createOrder);

// GET /api/orders/active - Get all active orders (manager only)
router.get('/orders/active', isAuthenticated, isManager, getActiveOrders);

// GET /api/orders/kitchen - Get detailed orders for kitchen monitor (cashier or manager)
router.get('/orders/kitchen', isAuthenticated, isCashierOrManager, getKitchenOrders);

// PATCH /api/orders/:orderId/status - Update order status (manager only)
router.patch('/orders/:orderId/status', isAuthenticated, isManager, updateOrderStatus);

// Revenue Report routes (manager only)
router.get('/revenue/daily', isAuthenticated, isManager, getDailyRevenueReport);
router.get('/revenue/summary', isAuthenticated, isManager, getRevenueSummary);
router.get('/revenue/orders/:date', isAuthenticated, isManager, getOrdersByDate);
router.get('/revenue/export/csv', isAuthenticated, isManager, exportRevenueReportCSV);

// Order Analytics routes (manager only)
router.get('/analytics/completion-time', isAuthenticated, isManager, getAverageCompletionTime);
router.get('/analytics/completion-time/hourly', isAuthenticated, isManager, getHourlyCompletionTime);
router.get('/analytics/completion-time/summary', isAuthenticated, isManager, getCompletionTimeSummary);

// Sales Analytics routes (manager only)
router.get('/analytics/best-selling', isAuthenticated, isManager, getBestSellingItems);
router.get('/analytics/sales-by-category', isAuthenticated, isManager, getSalesByCategory);
router.get('/analytics/sales-trends', isAuthenticated, isManager, getSalesTrends);
router.get('/analytics/sales-summary', isAuthenticated, isManager, getSalesSummary);

// Meal Type routes
router.get('/meal-types', getMealTypes);
router.get('/meal-types/:id', getMealTypeById);

// GET /api/db-test
router.get('/db-test', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    // Explicitly type error as Error
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/hello
router.get('/hello', (_req: Request, res: Response<ApiResponse<{ greeting: string }>>) => {
  res.json({
    success: true,
    data: {
      greeting: 'Hello from the typed Express API!',
    },
  });
});

import userRoutes from './user.routes';
// ... (other imports)

// ... (other routes)

// User management routes (manager only)
router.use('/users', isAuthenticated, isManager, userRoutes);

// External API routes
router.use('/translation', translationRoutes);
router.use('/weather', weatherRoutes);

// Test external APIs
router.get('/test-apis', async (_req: Request, res: Response) => {
  const results = {
    translation: { status: 'not tested', error: null as string | null },
    weather: { status: 'not tested', error: null as string | null },
  };

  // Test translation
  try {
    await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      {},
      {
        params: {
          q: 'Hello',
          target: 'es',
          key: process.env.GOOGLE_TRANSLATE_API_KEY,
        },
      }
    );
    results.translation.status = 'connected ✅';
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    results.translation.status = 'failed ❌';
    results.translation.error =
      err.response?.data?.error?.message || err.message || 'Unknown error';
  }

  // Test weather
  try {
    await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: 'London',
        appid: process.env.OPENWEATHER_API_KEY,
      },
    });
    results.weather.status = 'connected ✅';
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    results.weather.status = 'failed ❌';
    results.weather.error = err.response?.data?.message || err.message || 'Unknown error';
  }

  res.json(results);
});

export default router;
