import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './routes/api';
import pool from './db';
// Type declarations are automatically included from src/types/express.d.ts

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'AUTH_URL', 'AUTH_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(
    `Warning: Missing environment variables: ${missingEnvVars.join(', ')}. OAuth may not work correctly.`
  );
}

// Initialize
const app: Express = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    secret: process.env.AUTH_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // CSRF protection
    },
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth setup
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.AUTH_URL}/auth/google/callback`,
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
        try {
          if (!profile.id) {
            return done(new Error('Google profile ID is missing'), null);
          }

          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Email is required but not provided by Google'), null);
          }

          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              email,
              name: profile.displayName || undefined,
              updatedAt: new Date(),
            },
            create: {
              googleId: profile.id,
              email,
              name: profile.displayName || undefined,
              role: 'MANAGER', // default for now
            },
          });
          return done(null, user);
        } catch (err) {
          console.error('Error in Google OAuth strategy:', err);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials not configured. OAuth will not work.');
}

passport.serializeUser((user: Express.User, done: (err: any, id?: number) => void) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done: (err: any, user?: Express.User | null) => void) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return done(new Error('User not found'), null);
    }
    done(null, user);
  } catch (err) {
    console.error('Error deserializing user:', err);
    done(err, null);
  }
});

// --- AUTH MIDDLEWARE ---

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
    return;
  }
  res.status(401).json({ message: 'Not authenticated' });
};

// Middleware to check if user is a manager
export const isManager = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  
  if (!req.user || req.user.role !== 'MANAGER') {
    res.status(403).json({ message: 'Access denied. Manager role required.' });
    return;
  }
  
  next();
};

// --- AUTH ROUTES ---

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`,
  }),
  (_req: Request, res: Response) => {
    // Successful authentication
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
  }
);

// Get current authenticated user
app.get('/api/user', isAuthenticated, (req: Request, res: Response) => {
  res.json({
    id: req.user!.id,
    email: req.user!.email,
    name: req.user!.name,
    role: req.user!.role,
  });
});

// Logout endpoint
app.post('/api/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err?: Error) => {
    if (err) {
      return next(err);
    }
    if (req.session) {
      req.session.destroy((destroyErr?: Error) => {
        if (destroyErr) {
          return next(destroyErr);
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
      });
    } else {
      res.status(200).json({ message: 'Logged out successfully' });
    }
  });
});

// Check authentication status
app.get('/api/auth/status', (req: Request, res: Response) => {
  res.json({
    authenticated: req.isAuthenticated && req.isAuthenticated(),
    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
        }
      : null,
  });
});

// --- OTHER API ROUTES ---

app.use('/api', apiRouter);

// Example order creation endpoint (unchanged from yours)
app.post('/api/orders', async (req: Request, res: Response) => {
  const { order_items } = req.body;
  if (!order_items || !Array.isArray(order_items)) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderInsertQuery =
      'INSERT INTO "Order" (staff_id, datetime, price) VALUES ($1, $2, $3) RETURNING order_id';
    const orderValues = [1, new Date(), 0];
    const orderResult = await client.query(orderInsertQuery, orderValues);
    const orderId = orderResult.rows[0].order_id;

    let totalPrice = 0;

    for (const item of order_items) {
      const mealPrice = item.mealType.meal_type_price;
      const entreesUpcharge = item.entrees.reduce(
        (acc: number, entree: { upcharge: number }) => acc + entree.upcharge,
        0
      );
      const sidesUpcharge = item.sides.reduce(
        (acc: number, side: { upcharge: number }) => acc + side.upcharge,
        0
      );
      totalPrice += mealPrice + entreesUpcharge + sidesUpcharge;

      const mealInsertQuery =
        'INSERT INTO Meal (order_id, meal_type_id) VALUES ($1, $2) RETURNING meal_id';
      const mealValues = [orderId, item.mealType.meal_type_id];
      const mealResult = await client.query(mealInsertQuery, mealValues);
      const mealId = mealResult.rows[0].meal_id;

      for (const entree of item.entrees) {
        const detailInsertQuery =
          'INSERT INTO Meal_Detail (meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4)';
        const detailValues = [mealId, item.mealType.meal_type_id, entree.menu_item_id, 'entree'];
        await client.query(detailInsertQuery, detailValues);
      }

      for (const side of item.sides) {
        const detailInsertQuery =
          'INSERT INTO Meal_Detail (meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4)';
        const detailValues = [mealId, item.mealType.meal_type_id, side.menu_item_id, 'side'];
        await client.query(detailInsertQuery, detailValues);
      }
    }

    const updateOrderPriceQuery = 'UPDATE "Order" SET price = $1 WHERE order_id = $2';
    await client.query(updateOrderPriceQuery, [totalPrice, orderId]);
    await client.query('COMMIT');

    res.status(201).json({ message: 'Order submitted successfully', orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error submitting order:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// --- HEALTH ROUTE ---
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
