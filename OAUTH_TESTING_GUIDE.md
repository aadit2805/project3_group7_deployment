# OAuth Testing Guide

This guide will help you test the OAuth functionality in your application.

## Prerequisites

### 1. Google OAuth Credentials

You need to set up Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if prompted
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3001`
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
7. Copy the Client ID and Client Secret

### 2. Environment Variables

#### Backend (`apps/backend/.env` or root `.env`)

Create or update your backend `.env` file with:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Backend Configuration
PORT=3001
AUTH_URL=http://localhost:3001
AUTH_SECRET=your_random_secret_key_here_min_32_chars

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=your_database_url_here
```

**Important:** Generate a secure `AUTH_SECRET` (at least 32 characters). You can generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend (`apps/frontend/.env.local`)

Create or update your frontend `.env.local` file with:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 3. Database Setup

Make sure you've run the Prisma migration to create the User table:

```bash
cd apps/backend
npx prisma migrate dev --name add_user_model
```

Or if you prefer to push the schema directly:

```bash
cd apps/backend
npx prisma db push
```

## Testing Steps

### Step 1: Start the Backend Server

```bash
cd apps/backend
npm run dev
```

The server should start on `http://localhost:3001`. Check the console for any warnings about missing environment variables.

### Step 2: Start the Frontend Server

In a new terminal:

```bash
cd apps/frontend
npm run dev
```

The frontend should start on `http://localhost:3000`.

### Step 3: Test OAuth Flow

1. **Open your browser** and navigate to `http://localhost:3000`
2. **Click on "🔐 Test OAuth Login"** or navigate to `http://localhost:3000/login`
3. **Click "Sign in with Google"** button
4. **You'll be redirected to Google's OAuth consent screen**
   - Sign in with your Google account
   - Grant permissions if prompted
5. **After successful authentication**, you'll be redirected to `http://localhost:3000/dashboard`
6. **Verify the dashboard shows your user information:**
   - User ID
   - Email
   - Name
   - Role

### Step 4: Test Additional Features

On the dashboard page, you can:

- **Check Auth Status**: Click the "Check Auth Status" button to see the current authentication state
- **Logout**: Click the "Logout" button to end your session
- **Test Protected Routes**: Try accessing `/api/user` directly - it should require authentication

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution:** Run Prisma generate:
```bash
cd apps/backend
npx prisma generate
```

### Issue: "Warning: Missing environment variables"

**Solution:** Make sure all required environment variables are set in your backend `.env` file.

### Issue: "Redirect URI mismatch" error from Google

**Solution:** 
1. Check that your Google OAuth redirect URI is exactly: `http://localhost:3001/auth/google/callback`
2. Make sure there are no trailing slashes
3. Wait a few minutes after updating Google Console settings (they may take time to propagate)

### Issue: CORS errors

**Solution:**
1. Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
2. Make sure `credentials: 'include'` is set in fetch requests (already done in the code)
3. Check that the backend CORS configuration includes your frontend URL

### Issue: Session not persisting

**Solution:**
1. Make sure cookies are enabled in your browser
2. Check that `credentials: 'include'` is used in all API calls
3. Verify `AUTH_SECRET` is set and is a secure random string

### Issue: "User not found" error

**Solution:**
1. Make sure the User table exists in your database
2. Run the Prisma migration: `npx prisma migrate dev`
3. Check database connection string in `DATABASE_URL`

## Testing API Endpoints Directly

You can also test the OAuth endpoints directly:

### Check Authentication Status
```bash
curl http://localhost:3001/api/auth/status --cookie-jar cookies.txt --cookie cookies.txt
```

### Get Current User (requires authentication)
```bash
curl http://localhost:3001/api/user --cookie-jar cookies.txt --cookie cookies.txt
```

### Logout
```bash
curl -X POST http://localhost:3001/api/logout --cookie-jar cookies.txt --cookie cookies.txt
```

## Expected Flow

1. User clicks "Sign in with Google" → Redirects to `/auth/google`
2. Backend redirects to Google OAuth → User authenticates with Google
3. Google redirects back to `/auth/google/callback` → Backend creates/updates user
4. Backend redirects to `/dashboard` → Frontend displays user info
5. Session is maintained via cookies → User stays logged in

## Security Notes

- Never commit `.env` or `.env.local` files to version control
- Use strong, random `AUTH_SECRET` values
- In production, use HTTPS and secure cookies
- Regularly rotate OAuth credentials
- Use environment-specific OAuth credentials (dev/staging/prod)

## Next Steps

After confirming OAuth works:

1. Protect your API routes using the `isAuthenticated` middleware
2. Add role-based access control if needed
3. Implement proper error handling and user feedback
4. Add loading states and better UX
5. Consider adding refresh token logic for long sessions

