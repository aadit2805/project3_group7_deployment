import { Router, Request, Response } from 'express';
import { getMenuItems } from '../controllers/menuController';
import { createOrder } from '../controllers/orderController';
import { ApiResponse } from '../types';
import pool from '../config/db';
import translationRoutes from './translation.routes';
import weatherRoutes from './weather.routes';

const router = Router();

// GET /api/menu-items
router.get('/menu-items', getMenuItems);

// POST /api/orders
router.post('/orders', createOrder);

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

// GET /api/users (example)
router.get(
  '/users',
  (_req: Request, res: Response<ApiResponse<{ id: number; name: string }[]>>) => {
    res.json({
      success: true,
      data: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Bob Johnson' },
      ],
    });
  }
);

// POST /api/users (example)
router.post('/users', (req: Request, res: Response<ApiResponse<{ id: number; name: string }>>) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Name is required',
    });
  }

  return res.status(201).json({
    success: true,
    data: {
      id: Date.now(),
      name,
    },
  });
});

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
    const axios = require('axios');
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
    const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
    results.translation.status = 'failed ❌';
    results.translation.error = err.response?.data?.error?.message || err.message || 'Unknown error';
  }

  // Test weather
  try {
    const axios = require('axios');
    await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          q: 'London',
          appid: process.env.OPENWEATHER_API_KEY,
        },
      }
    );
    results.weather.status = 'connected ✅';
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    results.weather.status = 'failed ❌';
    results.weather.error = err.response?.data?.message || err.message || 'Unknown error';
  }

  res.json(results);
});

export default router;
