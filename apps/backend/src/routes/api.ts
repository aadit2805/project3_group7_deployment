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
  getPreparedOrders,
  markOrderAddressed,
  getCustomerOrders, // Import getCustomerOrders
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
import {
  getLocalStaffController,
  updateLocalStaffController,
  updateLocalStaffPasswordController,
  createLocalStaffController,
  staffLoginController,
  getAuthenticatedUserController, // Import getAuthenticatedUserController
} from '../controllers/staffController'; // Import all staff controllers
import { ApiResponse } from '../types';
import pool from '../config/db';
import translationRoutes from './translation.routes';
import weatherRoutes from './weather.routes';
import inventoryRoutes from './inventory.routes';
import { isAuthenticated, isManager, isCashierOrManager } from '../middleware/auth';
import { authenticateCustomer } from '../middleware/customerAuth'; // Import authenticateCustomer
import axios from 'axios';

const router = Router();

// GET /api/user - Get currently authenticated user (for both Google and local staff)
router.get('/user', isAuthenticated, getAuthenticatedUserController);

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

// GET /api/orders/customer/:customerId - Get orders for a specific customer
router.get('/orders/customer/:customerId', authenticateCustomer, getCustomerOrders);

// PATCH /api/orders/:orderId/status - Update order status (cashier or manager - needed for kitchen monitor)
router.patch('/orders/:orderId/status', isAuthenticated, isCashierOrManager, updateOrderStatus);

// Staff Login Route (public)
router.post('/staff/login', staffLoginController);

// Staff routes (manager only)
router.post('/staff/local', isAuthenticated, isManager, createLocalStaffController); // New route for creating local staff
router.get('/staff/local', isAuthenticated, isManager, getLocalStaffController);
router.put('/staff/local/:id', isAuthenticated, isManager, updateLocalStaffController); // New route for updating local staff
router.put(
  '/staff/local/:id/password',
  isAuthenticated,
  isManager,
  updateLocalStaffPasswordController
); // New route for updating local staff password
// GET /api/orders/prepared - Get prepared orders (completed but not addressed)
router.get('/orders/prepared', isAuthenticated, getPreparedOrders);

// PATCH /api/orders/:orderId/address - Mark order as addressed
router.patch('/orders/:orderId/address', isAuthenticated, markOrderAddressed);

// Revenue Report routes (manager only)
router.get('/revenue/daily', isAuthenticated, isManager, getDailyRevenueReport);
router.get('/revenue/summary', isAuthenticated, isManager, getRevenueSummary);
router.get('/revenue/orders/:date', isAuthenticated, isManager, getOrdersByDate);
router.get('/revenue/export/csv', isAuthenticated, isManager, exportRevenueReportCSV);

// Order Analytics routes (manager only)
router.get('/analytics/completion-time', isAuthenticated, isManager, getAverageCompletionTime);
router.get(
  '/analytics/completion-time/hourly',
  isAuthenticated,
  isManager,
  getHourlyCompletionTime
);
router.get(
  '/analytics/completion-time/summary',
  isAuthenticated,
  isManager,
  getCompletionTimeSummary
);

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
import customerAuthRoutes from './customerAuth.routes'; // Import the new customer auth routes
// ... (other imports)

// ... (other routes)

// User management routes (manager only)
router.use('/users', isAuthenticated, isManager, userRoutes);

// Customer authentication routes
router.use('/customer/auth', customerAuthRoutes); // Integrate new customer auth routes

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
