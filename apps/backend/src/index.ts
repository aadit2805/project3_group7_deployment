import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './routes/api';
import { isAuthenticated } from './middleware/auth';
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => {
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
              role: 'CASHIER', // default for new users
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

passport.deserializeUser(
  async (id: number, done: (err: any, user?: Express.User | null) => void) => {
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
  }
);

// --- AUTH MIDDLEWARE ---
// Authentication middleware is now in ./middleware/auth.ts

// --- AUTH ROUTES ---

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`,
  }),
  (req: Request, res: Response) => {
    // Successful authentication
    console.log('✅ OAuth Success! User:', req.user?.email, 'Session ID:', req.sessionID);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
  }
);

// Get current authenticated user
app.get('/api/user', isAuthenticated, (req: Request, res: Response) => {
  console.log('📋 /api/user - Authenticated! User:', req.user?.email);
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

// --- HEALTH ROUTE ---
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Debug route to check env vars
app.get('/debug/config', (_req: Request, res: Response) => {
  res.json({
    AUTH_URL: process.env.AUTH_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    HAS_GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    CALLBACK_URL: `${process.env.AUTH_URL}/auth/google/callback`,
    NODE_ENV: process.env.NODE_ENV,
  });
});

app.get('/', (_req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
