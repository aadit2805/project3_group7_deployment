import { Router, Request, Response } from 'express';
import { getMenuItems } from '../controllers/menuController';
import { ApiResponse } from '../types';
import pool from '../config/db';

const router = Router();

// GET /api/menu-items
router.get('/menu-items', getMenuItems);

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

export default router;
