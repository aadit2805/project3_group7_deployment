import { Request, Response } from 'express';
import pool from '../config/db';

interface CompletionTimeStats {
  date: string;
  average_completion_time_minutes: number;
  order_count: number;
  min_completion_time_minutes: number;
  max_completion_time_minutes: number;
}

interface HourlyCompletionTimeStats {
  hour: number;
  average_completion_time_minutes: number;
  order_count: number;
}

interface StatusTransitionStats {
  status: string;
  average_time_to_status_minutes: number;
  order_count: number;
}

// Get average order completion time by date
export const getAverageCompletionTime = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    // Query to calculate completion times (only for completed orders with completed_at set)
    if (date) {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          AVG(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as average_completion_time_minutes,
          COUNT(*) as order_count,
          MIN(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as min_completion_time_minutes,
          MAX(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as max_completion_time_minutes
        FROM "Order" o
        WHERE DATE(o.datetime) = $1
          AND o.order_status = 'completed'
          AND o.completed_at IS NOT NULL
          AND o.datetime IS NOT NULL
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
      queryParams = [date as string];
    } else if (start_date && end_date) {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          AVG(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as average_completion_time_minutes,
          COUNT(*) as order_count,
          MIN(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as min_completion_time_minutes,
          MAX(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as max_completion_time_minutes
        FROM "Order" o
        WHERE DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
          AND o.order_status = 'completed'
          AND o.completed_at IS NOT NULL
          AND o.datetime IS NOT NULL
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
      queryParams = [start_date as string, end_date as string];
    } else {
      // Default: last 30 days
      query = `
        SELECT 
          DATE(o.datetime) as date,
          AVG(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as average_completion_time_minutes,
          COUNT(*) as order_count,
          MIN(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as min_completion_time_minutes,
          MAX(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as max_completion_time_minutes
        FROM "Order" o
        WHERE o.datetime >= CURRENT_DATE - INTERVAL '30 days'
          AND o.order_status = 'completed'
          AND o.completed_at IS NOT NULL
          AND o.datetime IS NOT NULL
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
    }

    const result = await pool.query(query, queryParams);

    const stats: CompletionTimeStats[] = result.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      average_completion_time_minutes: parseFloat(row.average_completion_time_minutes) || 0,
      order_count: parseInt(row.order_count) || 0,
      min_completion_time_minutes: parseFloat(row.min_completion_time_minutes) || 0,
      max_completion_time_minutes: parseFloat(row.max_completion_time_minutes) || 0,
    }));

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching average completion time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve completion time statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get average completion time by hour of day
export const getHourlyCompletionTime = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    if (start_date && end_date) {
      query = `
        SELECT 
          EXTRACT(HOUR FROM o.datetime) as hour,
          AVG(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as average_completion_time_minutes,
          COUNT(*) as order_count
        FROM "Order" o
        WHERE DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
          AND o.order_status = 'completed'
          AND o.completed_at IS NOT NULL
          AND o.datetime IS NOT NULL
        GROUP BY EXTRACT(HOUR FROM o.datetime)
        ORDER BY hour
      `;
      queryParams = [start_date as string, end_date as string];
    } else {
      // Default: last 30 days
      query = `
        SELECT 
          EXTRACT(HOUR FROM o.datetime) as hour,
          AVG(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as average_completion_time_minutes,
          COUNT(*) as order_count
        FROM "Order" o
        WHERE o.datetime >= CURRENT_DATE - INTERVAL '30 days'
          AND o.order_status = 'completed'
          AND o.completed_at IS NOT NULL
          AND o.datetime IS NOT NULL
        GROUP BY EXTRACT(HOUR FROM o.datetime)
        ORDER BY hour
      `;
    }

    const result = await pool.query(query, queryParams);

    const stats: HourlyCompletionTimeStats[] = result.rows.map((row) => ({
      hour: parseInt(row.hour) || 0,
      average_completion_time_minutes: parseFloat(row.average_completion_time_minutes) || 0,
      order_count: parseInt(row.order_count) || 0,
    }));

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching hourly completion time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve hourly completion time statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get overall summary statistics
export const getCompletionTimeSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    if (start_date && end_date) {
      query = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as overall_average_minutes,
          COUNT(*) as total_completed_orders,
          MIN(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as fastest_order_minutes,
          MAX(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as slowest_order_minutes,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as median_minutes
        FROM "Order" o
        WHERE DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
          AND o.order_status = 'completed'
          AND o.completed_at IS NOT NULL
          AND o.datetime IS NOT NULL
      `;
      queryParams = [start_date as string, end_date as string];
    } else {
      // Default: last 30 days
      query = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as overall_average_minutes,
          COUNT(*) as total_completed_orders,
          MIN(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as fastest_order_minutes,
          MAX(EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as slowest_order_minutes,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (o.completed_at - o.datetime)) / 60) as median_minutes
        FROM "Order" o
        WHERE o.datetime >= CURRENT_DATE - INTERVAL '30 days'
          AND o.order_status = 'completed'
          AND o.completed_at IS NOT NULL
          AND o.datetime IS NOT NULL
      `;
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0 || result.rows[0].total_completed_orders === '0') {
      res.status(200).json({
        success: true,
        data: {
          overall_average_minutes: 0,
          total_completed_orders: 0,
          fastest_order_minutes: 0,
          slowest_order_minutes: 0,
          median_minutes: 0,
        },
      });
      return;
    }

    const row = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        overall_average_minutes: parseFloat(row.overall_average_minutes) || 0,
        total_completed_orders: parseInt(row.total_completed_orders) || 0,
        fastest_order_minutes: parseFloat(row.fastest_order_minutes) || 0,
        slowest_order_minutes: parseFloat(row.slowest_order_minutes) || 0,
        median_minutes: parseFloat(row.median_minutes) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching completion time summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve completion time summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
