import { Request } from 'express';
import prisma from '../config/prisma';

export interface AuditLogData {
  staff_id?: number;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  description?: string;
  ip_address?: string;
}

/**
 * Get staff ID from request user
 * Handles both local staff (staff_id) and Google OAuth users (id)
 * Works the same way as order submission - uses staff_id for local staff, id for Google users
 * 
 * For local staff, we always look up by username to ensure we get the correct staff_id,
 * as the session might have stale data.
 */
async function getStaffIdFromRequest(req: Request): Promise<number | undefined> {
  if (!req.user) {
    console.log('[Audit] No req.user found');
    return undefined;
  }

  const user = req.user as any;
  
  // Debug: Log the entire user object to see what we're working with
  console.log('[Audit] req.user object:', JSON.stringify({
    staff_id: user.staff_id,
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    type: user.type,
  }, null, 2));
  
  // For local staff with username, always look up the staff_id from the database
  // This ensures we get the correct staff_id even if the session has stale data
  if (user.username) {
    console.log('[Audit] Looking up staff by username:', user.username);
    try {
      const staff = await prisma.staff.findUnique({
        where: { username: user.username },
        select: { staff_id: true, username: true },
      });
      if (staff) {
        console.log('[Audit] Found staff:', staff);
        return staff.staff_id;
      } else {
        console.log('[Audit] No staff found with username:', user.username);
      }
    } catch (error) {
      console.error('[Audit] Error finding staff by username:', error);
      // Fallback to staff_id from user object if lookup fails
      if (user.staff_id) {
        console.log('[Audit] Using fallback staff_id:', user.staff_id);
        return user.staff_id;
      }
    }
  }
  
  // If no username but staff_id is available, use it (for local staff)
  if (user.staff_id !== undefined && user.staff_id !== null) {
    console.log('[Audit] Using staff_id directly:', user.staff_id);
    return user.staff_id;
  }
  
  // For Google OAuth users, look up staff entry by username (email or name)
  // This is the most reliable way since Google users have email/name as username
  if (user.id && !user.username && (user.email || user.name)) {
    console.log('[Audit] Processing Google user:', user.email || user.name);
    
    if (user.role === 'CASHIER' || user.role === 'MANAGER') {
      try {
        // Look up staff entry by username (which should be email or name for Google users)
        const searchUsernames = [];
        if (user.email) searchUsernames.push(user.email);
        if (user.name) searchUsernames.push(user.name);
        
        let staff = null;
        for (const searchUsername of searchUsernames) {
          staff = await prisma.staff.findFirst({
            where: { username: searchUsername },
            select: { staff_id: true, username: true },
          });
          if (staff) {
            // Update username to use name if it's currently email
            if (user.name && staff.username === user.email) {
              await prisma.staff.update({
                where: { staff_id: staff.staff_id },
                data: { username: user.name },
              });
              console.log('[Audit] Updated staff username from email to name');
              staff.username = user.name; // Update local reference
            }
            console.log('[Audit] Found staff entry by username:', staff);
            break;
          }
        }
        
        if (staff) {
          return staff.staff_id;
        }
        
        // If no staff entry found by username, check if one exists with staff_id = user.id
        // but only use it if the username matches (to avoid using wrong staff_id)
        const staffById = await prisma.staff.findUnique({
          where: { staff_id: user.id },
          select: { staff_id: true, username: true },
        });
        
        if (staffById) {
          // Verify this staff entry belongs to this user
          const usernameMatch = searchUsernames.includes(staffById.username);
          if (usernameMatch) {
            // Update username to use name if it's currently email
            if (user.name && staffById.username === user.email) {
              await prisma.staff.update({
                where: { staff_id: staffById.staff_id },
                data: { username: user.name },
              });
              console.log('[Audit] Updated staff username from email to name');
            }
            console.log('[Audit] Using staff entry with matching username:', staffById);
            return staffById.staff_id;
          } else {
            console.log('[Audit] Staff ID', user.id, 'exists but belongs to different user:', staffById.username);
          }
        }
        
        // No matching staff entry found - create a new one
        // Get the next available staff_id (don't use user.id as it might conflict)
        const maxStaffId = await prisma.staff.aggregate({
          _max: { staff_id: true },
        });
        const newStaffId = (maxStaffId._max.staff_id || 0) + 1;
        
        const newStaff = await prisma.staff.create({
          data: {
            staff_id: newStaffId,
            username: user.name || user.email || `user_${user.id}`, // Prefer name over email
            role: user.role,
            password_hash: "GOOGLE_AUTH_USER",
          },
        });
        
        console.log('[Audit] Created new staff entry:', newStaff);
        return newStaff.staff_id;
      } catch (error) {
        console.error('[Audit] Error finding/creating staff entry for Google user:', error);
        // Don't block audit logging - return undefined so it logs as null
        return undefined;
      }
    }
  }
  
  console.log('[Audit] Could not determine staff_id from user object');
  return undefined;
}

/**
 * Get IP address from request
 */
function getIpAddress(req: Request): string | undefined {
  // Check x-forwarded-for header first (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    if (typeof forwarded === 'string') {
      const ip = forwarded.split(',')[0].trim();
      if (ip && ip !== '1') {
        return ip;
      }
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      const ip = forwarded[0].trim();
      if (ip && ip !== '1') {
        return ip;
      }
    }
  }
  
  // Check x-real-ip header (another common proxy header)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string' && realIp !== '1') {
    return realIp;
  }
  
  // Fall back to req.ip or socket remote address
  const ip = req.ip || req.socket.remoteAddress;
  if (ip && ip !== '1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
    return ip;
  }
  
  // If all else fails, return undefined rather than a bad value
  return undefined;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  req: Request,
  data: Omit<AuditLogData, 'staff_id' | 'ip_address'>
): Promise<void> {
  try {
    const staff_id = await getStaffIdFromRequest(req);
    const ip_address = getIpAddress(req);

    console.log('[Audit] Creating audit log:', {
      staff_id,
      ip_address,
      action_type: data.action_type,
      entity_type: data.entity_type,
    });

    await prisma.auditLog.create({
      data: {
        staff_id: staff_id || null,
        action_type: data.action_type,
        entity_type: data.entity_type,
        entity_id: data.entity_id || null,
        old_values: data.old_values ? JSON.stringify(data.old_values) : null,
        new_values: data.new_values ? JSON.stringify(data.new_values) : null,
        description: data.description || null,
        ip_address: ip_address || null,
      },
    });
    
    console.log('[Audit] Audit log created successfully');
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('[Audit] Error creating audit log:', error);
  }
}

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogs(options: {
  staff_id?: number;
  entity_type?: string;
  entity_id?: string;
  action_type?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (options.staff_id) {
    where.staff_id = options.staff_id;
  }

  if (options.entity_type) {
    where.entity_type = options.entity_type;
  }

  if (options.entity_id) {
    where.entity_id = options.entity_id;
  }

  if (options.action_type) {
    where.action_type = options.action_type;
  }

  if (options.start_date || options.end_date) {
    where.created_at = {};
    if (options.start_date) {
      where.created_at.gte = options.start_date;
    }
    if (options.end_date) {
      where.created_at.lte = options.end_date;
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      staff: {
        select: {
          staff_id: true,
          username: true,
          role: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: options.limit || 100,
    skip: options.offset || 0,
  });

  const total = await prisma.auditLog.count({ where });

  // Parse JSON strings back to objects
  const parsedLogs = logs.map((log) => ({
    ...log,
    old_values: log.old_values ? JSON.parse(log.old_values) : null,
    new_values: log.new_values ? JSON.parse(log.new_values) : null,
  }));

  return {
    logs: parsedLogs,
    total,
    limit: options.limit || 100,
    offset: options.offset || 0,
  };
}

