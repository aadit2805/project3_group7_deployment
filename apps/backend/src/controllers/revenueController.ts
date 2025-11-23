import { Request, Response } from 'express';
import pool from '../config/db';

interface DailyRevenueReport {
  date: string;
  total_sales: number;
  order_count: number;
  average_order_value: number;
  total_tax: number;
  net_sales: number;
}

interface OrderBreakdown {
  order_id: number;
  datetime: string;
  price: number;
  order_status: string;
  customer_name: string | null;
}

// Get daily revenue report for a specific date or date range
export const getDailyRevenueReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    // If a single date is provided, get report for that date
    if (date) {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          COALESCE(SUM(o.price), 0) as total_sales,
          COUNT(DISTINCT o.order_id) as order_count,
          CASE 
            WHEN COUNT(DISTINCT o.order_id) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
            ELSE 0 
          END as average_order_value,
          COALESCE(SUM(o.price * 0.0825), 0) as total_tax,
          COALESCE(SUM(o.price * 0.9175), 0) as net_sales
        FROM "Order" o
        WHERE DATE(o.datetime) = $1
          AND o.order_status != 'cancelled'
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
      queryParams = [date as string];
    }
    // If start_date and end_date are provided, get reports for date range
    else if (start_date && end_date) {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          COALESCE(SUM(o.price), 0) as total_sales,
          COUNT(DISTINCT o.order_id) as order_count,
          CASE 
            WHEN COUNT(DISTINCT o.order_id) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
            ELSE 0 
          END as average_order_value,
          COALESCE(SUM(o.price * 0.0825), 0) as total_tax,
          COALESCE(SUM(o.price * 0.9175), 0) as net_sales
        FROM "Order" o
        WHERE DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
          AND o.order_status != 'cancelled'
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
      queryParams = [start_date as string, end_date as string];
    }
    // Default: get last 30 days of reports
    else {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          COALESCE(SUM(o.price), 0) as total_sales,
          COUNT(DISTINCT o.order_id) as order_count,
          CASE 
            WHEN COUNT(DISTINCT o.order_id) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
            ELSE 0 
          END as average_order_value,
          COALESCE(SUM(o.price * 0.0825), 0) as total_tax,
          COALESCE(SUM(o.price * 0.9175), 0) as net_sales
        FROM "Order" o
        WHERE o.datetime >= CURRENT_DATE - INTERVAL '30 days'
          AND o.order_status != 'cancelled'
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
    }

    const result = await pool.query(query, queryParams);

    const reports: DailyRevenueReport[] = result.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      total_sales: parseFloat(row.total_sales) || 0,
      order_count: parseInt(row.order_count) || 0,
      average_order_value: parseFloat(row.average_order_value) || 0,
      total_tax: parseFloat(row.total_tax) || 0,
      net_sales: parseFloat(row.net_sales) || 0,
    }));

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching daily revenue report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve revenue report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get detailed order breakdown for a specific date
export const getOrdersByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;

    if (!date) {
      res.status(400).json({
        success: false,
        error: 'Date parameter is required',
      });
      return;
    }

    const query = `
      SELECT 
        o.order_id,
        o.datetime,
        o.price,
        o.order_status,
        o.customer_name
      FROM "Order" o
      WHERE DATE(o.datetime) = $1
        AND o.order_status != 'cancelled'
      ORDER BY o.datetime DESC
    `;

    const result = await pool.query(query, [date]);

    const orders: OrderBreakdown[] = result.rows.map((row) => ({
      order_id: row.order_id,
      datetime: row.datetime,
      price: parseFloat(row.price) || 0,
      order_status: row.order_status || 'pending',
      customer_name: row.customer_name,
    }));

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders by date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get summary statistics (total revenue, average daily revenue, etc.)
export const getRevenueSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    if (start_date && end_date) {
      query = `
        SELECT 
          COALESCE(SUM(o.price), 0) as total_revenue,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT DATE(o.datetime)) as days_count,
          CASE 
            WHEN COUNT(DISTINCT DATE(o.datetime)) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT DATE(o.datetime))
            ELSE 0 
          END as average_daily_revenue,
          CASE 
            WHEN COUNT(DISTINCT o.order_id) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
            ELSE 0 
          END as average_order_value
        FROM "Order" o
        WHERE DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
          AND o.order_status != 'cancelled'
      `;
      queryParams = [start_date as string, end_date as string];
    } else {
      // Last 30 days
      query = `
        SELECT 
          COALESCE(SUM(o.price), 0) as total_revenue,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT DATE(o.datetime)) as days_count,
          CASE 
            WHEN COUNT(DISTINCT DATE(o.datetime)) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT DATE(o.datetime))
            ELSE 0 
          END as average_daily_revenue,
          CASE 
            WHEN COUNT(DISTINCT o.order_id) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
            ELSE 0 
          END as average_order_value
        FROM "Order" o
        WHERE o.datetime >= CURRENT_DATE - INTERVAL '30 days'
          AND o.order_status != 'cancelled'
      `;
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          total_revenue: 0,
          total_orders: 0,
          days_count: 0,
          average_daily_revenue: 0,
          average_order_value: 0,
        },
      });
      return;
    }

    const row = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        total_revenue: parseFloat(row.total_revenue) || 0,
        total_orders: parseInt(row.total_orders) || 0,
        days_count: parseInt(row.days_count) || 0,
        average_daily_revenue: parseFloat(row.average_daily_revenue) || 0,
        average_order_value: parseFloat(row.average_order_value) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve revenue summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Helper function to escape CSV values
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // If the value contains comma, newline, or quote, wrap it in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// Export daily revenue report as CSV
export const exportRevenueReportCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    // Use the same query logic as getDailyRevenueReport
    if (date) {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          COALESCE(SUM(o.price), 0) as total_sales,
          COUNT(DISTINCT o.order_id) as order_count,
          CASE 
            WHEN COUNT(DISTINCT o.order_id) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
            ELSE 0 
          END as average_order_value,
          COALESCE(SUM(o.price * 0.0825), 0) as total_tax,
          COALESCE(SUM(o.price * 0.9175), 0) as net_sales
        FROM "Order" o
        WHERE DATE(o.datetime) = $1
          AND o.order_status != 'cancelled'
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
      queryParams = [date as string];
    } else if (start_date && end_date) {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          COALESCE(SUM(o.price), 0) as total_sales,
          COUNT(DISTINCT o.order_id) as order_count,
          CASE 
            WHEN COUNT(DISTINCT o.order_id) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
            ELSE 0 
          END as average_order_value,
          COALESCE(SUM(o.price * 0.0825), 0) as total_tax,
          COALESCE(SUM(o.price * 0.9175), 0) as net_sales
        FROM "Order" o
        WHERE DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
          AND o.order_status != 'cancelled'
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
      queryParams = [start_date as string, end_date as string];
    } else {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          COALESCE(SUM(o.price), 0) as total_sales,
          COUNT(DISTINCT o.order_id) as order_count,
          CASE 
            WHEN COUNT(DISTINCT o.order_id) > 0 
            THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
            ELSE 0 
          END as average_order_value,
          COALESCE(SUM(o.price * 0.0825), 0) as total_tax,
          COALESCE(SUM(o.price * 0.9175), 0) as net_sales
        FROM "Order" o
        WHERE o.datetime >= CURRENT_DATE - INTERVAL '30 days'
          AND o.order_status != 'cancelled'
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
    }

    const result = await pool.query(query, queryParams);

    // Build CSV content
    const csvRows: string[] = [];
    
    // Add header row
    csvRows.push(
      'Date,Total Sales,Order Count,Average Order Value,Total Tax,Net Sales'
    );

    // Add data rows
    for (const row of result.rows) {
      const date = row.date.toISOString().split('T')[0];
      const totalSales = parseFloat(row.total_sales) || 0;
      const orderCount = parseInt(row.order_count) || 0;
      const avgOrderValue = parseFloat(row.average_order_value) || 0;
      const totalTax = parseFloat(row.total_tax) || 0;
      const netSales = parseFloat(row.net_sales) || 0;

      csvRows.push(
        `${escapeCSVValue(date)},${escapeCSVValue(totalSales.toFixed(2))},${escapeCSVValue(orderCount)},${escapeCSVValue(avgOrderValue.toFixed(2))},${escapeCSVValue(totalTax.toFixed(2))},${escapeCSVValue(netSales.toFixed(2))}`
      );
    }

    // Add summary row
    const totalSales = result.rows.reduce((sum, row) => sum + (parseFloat(row.total_sales) || 0), 0);
    const totalOrders = result.rows.reduce((sum, row) => sum + (parseInt(row.order_count) || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalTax = totalSales * 0.0825;
    const netSales = totalSales * 0.9175;

    csvRows.push('');
    csvRows.push(
      `TOTAL,${escapeCSVValue(totalSales.toFixed(2))},${escapeCSVValue(totalOrders)},${escapeCSVValue(avgOrderValue.toFixed(2))},${escapeCSVValue(totalTax.toFixed(2))},${escapeCSVValue(netSales.toFixed(2))}`
    );

    const csvContent = csvRows.join('\n');

    // Generate filename with date range
    let filename = 'revenue-report';
    if (date) {
      filename = `revenue-report-${date}`;
    } else if (start_date && end_date) {
      filename = `revenue-report-${start_date}-to-${end_date}`;
    } else {
      const today = new Date().toISOString().split('T')[0];
      filename = `revenue-report-last-30-days-${today}`;
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting revenue report CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export revenue report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
