# Quick Setup Guide

## Prerequisites
- Node.js (v14+)
- MongoDB (local installation or MongoDB Atlas account)

## Step 1: Install Dependencies

From the root directory:
```bash
npm run install-all
```

Or manually:
```bash
npm install
cd frontend
npm install
cd ..
```

## Step 2: Setup MongoDB

### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/lifelong`

### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env` file with your connection string

## Step 3: Configure Environment Variables

### Backend (.env in backend folder)
Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lifelong
JWT_SECRET=your_super_secret_jwt_key_change_this
CLIENT_URL=http://localhost:3000
```

### Frontend (.env in frontend folder)
Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Step 4: Start the Application

### Development Mode (Both servers)
From root directory:
```bash
npm run dev
```

### Or Start Separately

Backend only:
```bash
npm run server
```

Frontend only (from frontend directory):
```bash
cd frontend
npm start
```

## Step 5: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Step 6: Create Admin User

To create an admin user, you'll need to manually insert one into MongoDB or use MongoDB Compass:

```javascript
// In MongoDB shell or Compass
use lifelong
db.users.insertOne({
  name: "Admin",
  email: "admin@lifelong.com",
  password: "$2a$10$...", // Use bcrypt to hash password
  role: "admin",
  isVerified: true
})
```

Or use a tool like Postman to register, then manually update the role in the database.

## Testing the Application

1. Register as a Patient
2. Register as a Doctor (complete profile with license)
3. Login as Admin and verify the doctor
4. Login as Patient and search for doctors
5. Connect with a doctor
6. Start chatting!

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)

### Port Already in Use
- Change PORT in backend/.env
- Update REACT_APP_API_URL in frontend/.env accordingly

### CORS Errors
- Ensure CLIENT_URL in backend/.env matches your frontend URL
- Check that both servers are running

### Module Not Found
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

