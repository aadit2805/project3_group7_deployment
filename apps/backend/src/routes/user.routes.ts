import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { isManager } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users - Get all users (Manager only)
router.get('/', isManager, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// PUT /api/users/:id/role - Update user role (Manager only)
router.put('/:id/role', isManager, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    res.status(400).json({ error: 'Role is required' });
    return;
  }

  // Basic role validation
  if (!['CASHIER', 'MANAGER'].includes(role)) {
    res.status(400).json({ error: 'Invalid role specified' });
    return;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { role },
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(`Failed to update role for user ${id}:`, error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
