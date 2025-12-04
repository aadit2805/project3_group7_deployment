import prisma from '../config/prisma';

export interface CreateDiscountData {
  code: string;
  name: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  start_date: Date;
  end_date: Date;
  is_active?: boolean;
  usage_limit?: number;
}

export interface UpdateDiscountData extends Partial<CreateDiscountData> {
  id: number;
}

/**
 * Validate discount code format
 */
export function validateDiscountCode(code: string): boolean {
  // Allow alphanumeric and hyphens, 3-50 characters
  return /^[A-Z0-9-]{3,50}$/i.test(code);
}

/**
 * Calculate discount amount based on order total
 */
export function calculateDiscountAmount(
  discount: {
    discount_type: string;
    discount_value: number;
    max_discount_amount?: number | null;
  },
  orderTotal: number
): number {
  let discountAmount = 0;

  if (discount.discount_type === 'PERCENTAGE') {
    discountAmount = (orderTotal * Number(discount.discount_value)) / 100;
    // Apply max discount if specified
    if (discount.max_discount_amount && discountAmount > Number(discount.max_discount_amount)) {
      discountAmount = Number(discount.max_discount_amount);
    }
  } else if (discount.discount_type === 'FIXED_AMOUNT') {
    discountAmount = Number(discount.discount_value);
    // Don't allow discount to exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }
  }

  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if discount is valid and applicable
 */
export async function validateDiscount(
  code: string,
  orderTotal: number
): Promise<{ valid: boolean; discount?: any; error?: string }> {
  const discount = await prisma.promotionalDiscount.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discount) {
    return { valid: false, error: 'Discount code not found' };
  }

  if (!discount.is_active) {
    return { valid: false, error: 'Discount code is not active' };
  }

  const now = new Date();
  if (now < discount.start_date) {
    return { valid: false, error: 'Discount code has not started yet' };
  }

  if (now > discount.end_date) {
    return { valid: false, error: 'Discount code has expired' };
  }

  if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
    return { valid: false, error: 'Discount code usage limit reached' };
  }

  if (discount.min_order_amount && orderTotal < Number(discount.min_order_amount)) {
    return {
      valid: false,
      error: `Minimum order amount of $${discount.min_order_amount} required`,
    };
  }

  return { valid: true, discount };
}

/**
 * Get all active discounts
 */
export async function getActiveDiscounts() {
  const now = new Date();
  const discounts = await prisma.promotionalDiscount.findMany({
    where: {
      is_active: true,
      start_date: { lte: now },
      end_date: { gte: now },
    },
    orderBy: { created_at: 'desc' },
  });

  // Filter out discounts that have reached their usage limit
  return discounts.filter((discount) => {
    if (discount.usage_limit === null) return true;
    return discount.usage_count < discount.usage_limit;
  });
}

/**
 * Get all discounts (for manager view)
 */
export async function getAllDiscounts() {
  return await prisma.promotionalDiscount.findMany({
    include: {
      created_by_staff: {
        select: {
          staff_id: true,
          username: true,
          role: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}

/**
 * Get discount by ID
 */
export async function getDiscountById(id: number) {
  return await prisma.promotionalDiscount.findUnique({
    where: { id },
    include: {
      created_by_staff: {
        select: {
          staff_id: true,
          username: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Create a new discount
 */
export async function createDiscount(data: CreateDiscountData, createdBy: number) {
  // Check if code already exists
  const existing = await prisma.promotionalDiscount.findUnique({
    where: { code: data.code.toUpperCase() },
  });

  if (existing) {
    throw new Error('Discount code already exists');
  }

  return await prisma.promotionalDiscount.create({
    data: {
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_order_amount: data.min_order_amount,
      max_discount_amount: data.max_discount_amount,
      start_date: data.start_date,
      end_date: data.end_date,
      is_active: data.is_active !== undefined ? data.is_active : true,
      usage_limit: data.usage_limit,
      created_by: createdBy,
    },
    include: {
      created_by_staff: {
        select: {
          staff_id: true,
          username: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Update a discount
 */
export async function updateDiscount(data: UpdateDiscountData) {
  const { id, ...updateData } = data;

  // If code is being updated, check if new code already exists
  if (updateData.code) {
    const existing = await prisma.promotionalDiscount.findFirst({
      where: {
        code: updateData.code.toUpperCase(),
        id: { not: id },
      },
    });

    if (existing) {
      throw new Error('Discount code already exists');
    }

    updateData.code = updateData.code.toUpperCase();
  }

  return await prisma.promotionalDiscount.update({
    where: { id },
    data: updateData,
    include: {
      created_by_staff: {
        select: {
          staff_id: true,
          username: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Delete a discount
 */
export async function deleteDiscount(id: number) {
  return await prisma.promotionalDiscount.delete({
    where: { id },
  });
}

/**
 * Increment usage count for a discount
 */
export async function incrementDiscountUsage(discountId: number) {
  return await prisma.promotionalDiscount.update({
    where: { id: discountId },
    data: {
      usage_count: {
        increment: 1,
      },
    },
  });
}

