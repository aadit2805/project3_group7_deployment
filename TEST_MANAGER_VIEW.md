# Testing Manager View Locally

## Prerequisites

1. ✅ Backend server running on `http://localhost:3001`
2. ✅ Frontend server running on `http://localhost:3000`
3. ✅ OAuth configured and working
4. ✅ User authenticated with MANAGER role

## Step-by-Step Testing Guide

### 1. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

### 2. Verify Backend is Running

Check that the backend is accessible:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

### 3. Login as Manager

1. Open browser: `http://localhost:3000`
2. Click "🔐 Test OAuth Login" or go to `http://localhost:3000/login`
3. Sign in with Google OAuth
4. You should be redirected to `/dashboard`

**Note:** By default, all OAuth users are created with `MANAGER` role, so you should have access.

### 4. Access Manager Dashboard

**Option A: From User Dashboard**
- After logging in, you'll be at `/dashboard`
- Click the green "Manager Dashboard" button
- You should be redirected to `/manager`

**Option B: Direct URL**
- Navigate directly to: `http://localhost:3000/manager`

### 5. Test Adding Menu Items

1. **Fill out the form:**
   - **Name:** e.g., "Orange Chicken"
   - **Type:** Select from dropdown (entree, side, or drink)
   - **Upcharge:** e.g., `0.00` (or leave as 0)
   - **Menu Item ID:** Leave empty (auto-generated) or specify a number
   - **Available:** Check the box

2. **Click "Add Menu Item"**

3. **Expected Result:**
   - Success message appears
   - Form clears
   - After 1.5 seconds, automatically switches to "Manage Menu Items" tab
   - New item appears in the table

### 6. Test Managing Menu Items

1. **Switch to "Manage Menu Items" tab** (if not already there)

2. **View the list:**
   - Should see a table with all menu items
   - Columns: ID, Name, Type, Upcharge, Available, Actions

3. **Test Edit:**
   - Click "Edit" on any menu item
   - Fields become editable inline
   - Modify name, type, upcharge, or availability
   - Click "Save"
   - Changes should be reflected immediately

4. **Test Toggle Availability:**
   - Click the availability badge (Available/Unavailable)
   - Status should toggle immediately
   - No confirmation needed

5. **Test Delete:**
   - Click "Delete" on a menu item
   - Confirm the deletion in the popup
   - Item should be removed from the list

6. **Test Refresh:**
   - Click "Refresh" button
   - List should reload from server

### 7. Test Error Handling

**Test Invalid Data:**
- Try submitting form without name → Should show error
- Try invalid item_type → Should show error

**Test Unauthorized Access:**
- If you're not a manager, you should see "Access denied" message

**Test Network Errors:**
- Stop backend server
- Try to add/edit/delete → Should show error message

## API Testing (Optional)

You can also test the API endpoints directly:

### Get Menu Items
```bash
curl http://localhost:3001/api/menu-items
```

### Create Menu Item (requires authentication)
```bash
curl -X POST http://localhost:3001/api/menu-items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{
    "name": "Test Item",
    "item_type": "entree",
    "upcharge": 0,
    "is_available": true
  }'
```

### Update Menu Item
```bash
curl -X PUT http://localhost:3001/api/menu-items/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{
    "name": "Updated Name",
    "is_available": false
  }'
```

### Delete Menu Item
```bash
curl -X DELETE http://localhost:3001/api/menu-items/1 \
  -b cookies.txt \
  -c cookies.txt
```

## Troubleshooting

### Issue: "Access denied. Manager role required."

**Solution:**
- Check your user role in the database
- Default OAuth users should have `MANAGER` role
- You can verify by checking `/api/user` endpoint response

### Issue: Menu items not appearing

**Solution:**
- Check browser console for errors
- Check backend console for errors
- Verify database connection
- Check that menu_items table exists

### Issue: Form submission fails

**Solution:**
- Check browser console for error messages
- Verify backend is running
- Check network tab for API response
- Ensure you're authenticated (check cookies)

### Issue: Can't edit/delete items

**Solution:**
- Verify you're logged in as manager
- Check browser console for 403 errors
- Verify API endpoints are protected correctly

## Expected Behavior Summary

✅ **Add Menu Item:**
- Form validates required fields
- Auto-generates ID if not provided
- Creates item in database
- Shows success message
- Auto-redirects to list view

✅ **Edit Menu Item:**
- Inline editing works
- Can update any field
- Changes persist to database
- List refreshes automatically

✅ **Delete Menu Item:**
- Confirmation dialog appears
- Item removed from database
- List updates immediately

✅ **Toggle Availability:**
- One-click toggle
- No confirmation needed
- Updates database immediately

✅ **Security:**
- Only managers can access
- API endpoints protected
- Frontend checks role
- Unauthorized users see error

## Success Criteria

- ✅ Can add new menu items
- ✅ Can view all menu items in table
- ✅ Can edit existing menu items
- ✅ Can delete menu items
- ✅ Can toggle availability
- ✅ Only managers can access
- ✅ Error handling works
- ✅ UI is responsive and user-friendly

