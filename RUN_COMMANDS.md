# How to Run LifeLong Project

## Prerequisites
1. **Install dependencies first** (if not already done):
   ```bash
   npm run install-all
   ```

2. **Setup MongoDB**:
   - Make sure MongoDB is running locally, OR
   - Have MongoDB Atlas connection string ready

3. **Create environment files**:
   - Create `backend/.env` file (see below)
   - Create `frontend/.env` file (see below)

---

## Option 1: Run Both Backend and Frontend Together (Recommended)

From the **root directory** (`LifeLong`):

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend app on `http://localhost:3000`

---

## Option 2: Run Backend and Frontend Separately

### Run Backend Only

From the **root directory**:

```bash
npm run server
```

Or manually:
```bash
cd backend
node server.js
```

Backend will run on: `http://localhost:5000`

### Run Frontend Only

**Option A** - From root directory:
```bash
npm run client
```

**Option B** - From frontend directory:
```bash
cd frontend
npm start
```

Frontend will run on: `http://localhost:3000`

---

## Environment Files Setup

### Backend `.env` file
Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lifelong
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLIENT_URL=http://localhost:3000
```

### Frontend `.env` file
Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Quick Start Commands Summary

```bash
# 1. Install all dependencies
npm run install-all

# 2. Create .env files (see above)

# 3. Start both servers
npm run dev
```

---

## Troubleshooting

### If MongoDB connection fails:
- Check if MongoDB is running: `mongod --version`
- Verify connection string in `backend/.env`
- For MongoDB Atlas, use full connection string with username/password

### If ports are already in use:
- Change `PORT` in `backend/.env`
- Update `REACT_APP_API_URL` in `frontend/.env` accordingly
- Or kill the process using the port

### If modules are missing:
```bash
# Delete node_modules and reinstall
rm -rf node_modules frontend/node_modules
npm run install-all
```

---

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/auth/me (requires auth token)

