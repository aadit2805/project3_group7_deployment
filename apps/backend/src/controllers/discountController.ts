import { Request, Response } from 'express';
import {
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getAllDiscounts,
  getDiscountById,
  getActiveDiscounts,
  validateDiscount,
  calculateDiscountAmount,
  validateDiscountCode,
  CreateDiscountData,
  UpdateDiscountData,
} from '../services/discountService';
import { createAuditLog } from '../services/auditService';
import prisma from '../config/prisma';

// Helper to get staff ID from request
async function getStaffId(req: Request): Promise<number | undefined> {
  if (!req.user) return undefined;
  const user = req.user as any;
  
  // For local staff, look up by username
  if (user.username) {
    try {
      const staff = await prisma.staff.findUnique({
        where: { username: user.username },
        select: { staff_id: true },
      });
      if (staff) return staff.staff_id;
    } catch (error) {
      console.error('Error finding staff by username:', error);
    }
  }
  
  // Fallback to staff_id or id
  if (user.staff_id) return user.staff_id;
  if (user.id) return user.id;
  return undefined;
}

/**
 * GET /api/discounts - Get all discounts (manager only)
 */
export const getAllDiscountsController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const discounts = await getAllDiscounts();
    res.status(200).json({ success: true, data: discounts });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve discounts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/discounts/active - Get active discounts (public)
 */
export const getActiveDiscountsController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const discounts = await getActiveDiscounts();
    res.status(200).json({ success: true, data: discounts });
  } catch (error) {
    console.error('Error fetching active discounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve active discounts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/discounts/:id - Get discount by ID
 */
export const getDiscountByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const discount = await getDiscountById(parseInt(id, 10));

    if (!discount) {
      res.status(404).json({ success: false, error: 'Discount not found' });
      return;
    }

    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    console.error('Error fetching discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve discount',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/discounts - Create a new discount (manager only)
 */
export const createDiscountController = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      start_date,
      end_date,
      is_active,
      usage_limit,
    } = req.body;

    // Validation
    if (!code || !name || !discount_type || discount_value === undefined || !start_date || !end_date) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: code, name, discount_type, discount_value, start_date, end_date',
      });
      return;
    }

    if (!validateDiscountCode(code)) {
      res.status(400).json({
        success: false,
        error: 'Invalid discount code format. Use 3-50 alphanumeric characters and hyphens only.',
      });
      return;
    }

    if (discount_type !== 'PERCENTAGE' && discount_type !== 'FIXED_AMOUNT') {
      res.status(400).json({
        success: false,
        error: 'discount_type must be either PERCENTAGE or FIXED_AMOUNT',
      });
      return;
    }

    if (discount_type === 'PERCENTAGE' && (discount_value < 0 || discount_value > 100)) {
      res.status(400).json({
        success: false,
        error: 'Percentage discount must be between 0 and 100',
      });
      return;
    }

    if (discount_type === 'FIXED_AMOUNT' && discount_value < 0) {
      res.status(400).json({
        success: false,
        error: 'Fixed amount discount must be positive',
      });
      return;
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
      return;
    }

    if (endDate <= startDate) {
      res.status(400).json({
        success: false,
        error: 'End date must be after start date',
      });
      return;
    }

    const staffId = await getStaffId(req);
    if (!staffId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const discountData: CreateDiscountData = {
      code,
      name,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      start_date: startDate,
      end_date: endDate,
      is_active: is_active !== undefined ? is_active : true,
      usage_limit,
    };

    const discount = await createDiscount(discountData, staffId);

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'CREATE',
      entity_type: 'promotional_discount',
      entity_id: String(discount.id),
      new_values: discount,
      description: `Created promotional discount: ${name} (Code: ${code})`,
    });

    res.status(201).json({ success: true, data: discount });
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create discount',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/discounts/:id - Update a discount (manager only)
 */
export const updateDiscountController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateDiscountData = { id: parseInt(id, 10), ...req.body };

    // Get old values for audit log
    const oldDiscount = await getDiscountById(parseInt(id, 10));
    if (!oldDiscount) {
      res.status(404).json({ success: false, error: 'Discount not found' });
      return;
    }

    // Validate discount code if being updated
    if (updateData.code && !validateDiscountCode(updateData.code)) {
      res.status(400).json({
        success: false,
        error: 'Invalid discount code format. Use 3-50 alphanumeric characters and hyphens only.',
      });
      return;
    }

    // Validate discount type and value if being updated
    if (updateData.discount_type && updateData.discount_type !== 'PERCENTAGE' && updateData.discount_type !== 'FIXED_AMOUNT') {
      res.status(400).json({
        success: false,
        error: 'discount_type must be either PERCENTAGE or FIXED_AMOUNT',
      });
      return;
    }

    if (updateData.discount_value !== undefined) {
      const discountType = updateData.discount_type || oldDiscount.discount_type;
      if (discountType === 'PERCENTAGE' && (updateData.discount_value < 0 || updateData.discount_value > 100)) {
        res.status(400).json({
          success: false,
          error: 'Percentage discount must be between 0 and 100',
        });
        return;
      }
      if (discountType === 'FIXED_AMOUNT' && updateData.discount_value < 0) {
        res.status(400).json({
          success: false,
          error: 'Fixed amount discount must be positive',
        });
        return;
      }
    }

    // Parse dates if provided
    if (updateData.start_date) {
      updateData.start_date = new Date(updateData.start_date);
    }
    if (updateData.end_date) {
      updateData.end_date = new Date(updateData.end_date);
    }

    const discount = await updateDiscount(updateData);

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'UPDATE',
      entity_type: 'promotional_discount',
      entity_id: String(id),
      old_values: oldDiscount,
      new_values: discount,
      description: `Updated promotional discount: ${discount.name} (Code: ${discount.code})`,
    });

    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update discount',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * DELETE /api/discounts/:id - Delete a discount (manager only)
 */
export const deleteDiscountController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get old values for audit log
    const oldDiscount = await getDiscountById(parseInt(id, 10));
    if (!oldDiscount) {
      res.status(404).json({ success: false, error: 'Discount not found' });
      return;
    }

    await deleteDiscount(parseInt(id, 10));

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'DELETE',
      entity_type: 'promotional_discount',
      entity_id: String(id),
      old_values: oldDiscount,
      description: `Deleted promotional discount: ${oldDiscount.name} (Code: ${oldDiscount.code})`,
    });

    res.status(200).json({ success: true, message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete discount',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/discounts/validate - Validate a discount code
 */
export const validateDiscountController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, order_total } = req.body;

    if (!code) {
      res.status(400).json({ success: false, error: 'Discount code is required' });
      return;
    }

    const orderTotal = order_total || 0;
    const validation = await validateDiscount(code, orderTotal);

    if (!validation.valid) {
      res.status(200).json({
        success: false,
        valid: false,
        error: validation.error,
      });
      return;
    }

    const discountAmount = calculateDiscountAmount(validation.discount!, orderTotal);

    res.status(200).json({
      success: true,
      valid: true,
      discount: validation.discount,
      discount_amount: discountAmount,
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate discount',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

