# How to Access Admin Dashboard

## Step-by-Step Guide

### Step 1: Create Admin Account

First, create the admin account using the script:

```bash
npm run create-admin
```

This will create an admin with:
- **Email**: `admin@lifelong.com`
- **Password**: `admin123`

### Step 2: Start the Application

Make sure both backend and frontend are running:

```bash
npm run dev
```

Or run separately:
- Backend: `npm run server`
- Frontend: `npm run client`

### Step 3: Login as Admin

1. Open your browser and go to: **http://localhost:3000**
2. Click on **"Login"** button (top right)
3. Enter admin credentials:
   - Email: `admin@lifelong.com`
   - Password: `admin123`
4. Click **"Sign In"** button

### Step 4: Access Admin Dashboard

After successful login, you will be **automatically redirected** to:
- **URL**: `http://localhost:3000/dashboard`
- **Dashboard**: Admin Dashboard will be displayed

The system automatically detects your role and shows the appropriate dashboard.

---

## What You'll See

The Admin Dashboard shows:

1. **Pending Doctors** - Doctors waiting for verification
   - View doctor details (name, license, registration number)
   - Click "Verify Doctor" to approve

2. **Pending Hospitals** - Hospitals waiting for verification
   - View hospital details (name, registration ID)
   - Click "Verify Hospital" to approve

---

## Troubleshooting

### Can't Login
- Verify admin account was created: `npm run create-admin`
- Check MongoDB is running
- Verify email and password are correct

### Wrong Dashboard Shows
- Make sure you logged in with admin credentials
- Check user role in database is `'admin'` (lowercase)
- Clear browser cache and localStorage, then login again

### Dashboard Not Loading
- Check browser console for errors
- Verify backend API is running on port 5000
- Check network tab for API calls

### "Access Denied" Error
- Verify the user role is exactly `'admin'` in database
- Check that `isVerified` is `true` for admin user
- Make sure JWT token is being sent in requests

---

## Quick Test

1. **Create admin**: `npm run create-admin`
2. **Start app**: `npm run dev`
3. **Open browser**: http://localhost:3000
4. **Login**: admin@lifelong.com / admin123
5. **Dashboard**: Automatically shows admin dashboard

---

## Security Note

⚠️ **Change the default password** after first login for security!

