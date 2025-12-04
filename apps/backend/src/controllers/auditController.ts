import { Request, Response } from 'express';
import { getAuditLogs } from '../services/auditService';

interface AuditLogFilterOptions {
  staff_id?: number;
  entity_type?: string;
  entity_id?: string;
  action_type?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Get audit logs with optional filtering
 * GET /api/audit-logs?staff_id=1&entity_type=menu_item&action_type=UPDATE&start_date=2024-01-01&end_date=2024-12-31&limit=50&offset=0
 */
export const getAuditLogsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staff_id, entity_type, entity_id, action_type, start_date, end_date, limit, offset } =
      req.query;

    const options: AuditLogFilterOptions = {};

    if (staff_id) {
      options.staff_id = parseInt(staff_id as string, 10);
      if (isNaN(options.staff_id)) {
        res.status(400).json({ error: 'Invalid staff_id parameter' });
        return;
      }
    }

    if (entity_type) {
      options.entity_type = entity_type as string;
    }

    if (entity_id) {
      options.entity_id = entity_id as string;
    }

    if (action_type) {
      options.action_type = action_type as string;
    }

    if (start_date) {
      // Parse date and set to start of day in UTC
      const startDate = new Date(start_date as string);
      if (isNaN(startDate.getTime())) {
        res.status(400).json({ error: 'Invalid start_date parameter' });
        return;
      }
      // Set to start of day in UTC
      startDate.setUTCHours(0, 0, 0, 0);
      options.start_date = startDate;
    }

    if (end_date) {
      // Parse date and set to end of day in UTC
      const endDate = new Date(end_date as string);
      if (isNaN(endDate.getTime())) {
        res.status(400).json({ error: 'Invalid end_date parameter' });
        return;
      }
      // Set to end of day in UTC (23:59:59.999)
      endDate.setUTCHours(23, 59, 59, 999);
      options.end_date = endDate;
    }

    if (limit) {
      options.limit = parseInt(limit as string, 10);
      if (isNaN(options.limit) || options.limit < 1) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }
      // Cap limit at 1000 to prevent performance issues
      options.limit = Math.min(options.limit, 1000);
    }

    if (offset) {
      options.offset = parseInt(offset as string, 10);
      if (isNaN(options.offset) || options.offset < 0) {
        res.status(400).json({ error: 'Invalid offset parameter' });
        return;
      }
    }

    const result = await getAuditLogs(options);

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.logs.length < result.total,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
