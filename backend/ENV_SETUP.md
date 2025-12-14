# Backend .env File Setup

## Required Environment Variables

Create a file named `.env` in the `backend` folder with the following fields:

```env
# Server Configuration
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lifelong

# JWT Secret Key (for authentication tokens)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Frontend URL (for CORS and Socket.io)
CLIENT_URL=http://localhost:3000
```

---

## Field Descriptions

### 1. PORT (Required)
- **What**: Port number for the backend server
- **Default**: 5000 (if not provided)
- **Example**: `PORT=5000`
- **Note**: Make sure this port is not already in use

### 2. MONGODB_URI (Required)
- **What**: MongoDB connection string
- **Default**: `mongodb://localhost:27017/lifelong` (if not provided)
- **Local MongoDB Example**: 
  ```
  MONGODB_URI=mongodb://localhost:27017/lifelong
  ```
- **MongoDB Atlas Example**:
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifelong?retryWrites=true&w=majority
  ```
- **Note**: Replace `username` and `password` with your MongoDB Atlas credentials

### 3. JWT_SECRET (Required)
- **What**: Secret key for signing JWT authentication tokens
- **Default**: `your_jwt_secret_key_here` (if not provided, but NOT recommended)
- **Example**: `JWT_SECRET=my_super_secret_key_12345`
- **Security Note**: 
  - Use a long, random string in production
  - Never commit this to version control
  - Generate a strong secret: `openssl rand -base64 32`

### 4. CLIENT_URL (Required)
- **What**: Frontend application URL (for CORS and Socket.io)
- **Default**: `http://localhost:3000` (if not provided)
- **Development Example**: `CLIENT_URL=http://localhost:3000`
- **Production Example**: `CLIENT_URL=https://yourdomain.com`
- **Note**: This allows the frontend to communicate with the backend

---

## Complete .env File Template

Copy and paste this into `backend/.env`:

```env
# Server Port
PORT=5000

# MongoDB Connection String
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/lifelong

# For MongoDB Atlas (replace with your credentials):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifelong?retryWrites=true&w=majority

# JWT Secret Key (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Frontend URL
CLIENT_URL=http://localhost:3000

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Quick Setup Steps

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create .env file:**
   - Windows: `type nul > .env`
   - Or create manually in your editor

3. **Add the variables** (copy the template above)

4. **Update values:**
   - Change `JWT_SECRET` to a random string
   - Update `MONGODB_URI` if using MongoDB Atlas
   - Adjust `PORT` if 5000 is already in use
   - Update `CLIENT_URL` if frontend runs on different port

---

## Validation

After creating the `.env` file, verify it's in the correct location:

```
LifeLong/
└── backend/
    ├── .env          ← Should be here
    ├── server.js
    └── ...
```

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to Git
- `.env` is already in `.gitignore`
- Use different `JWT_SECRET` for production
- Keep `MONGODB_URI` secure (contains credentials)

---

## Troubleshooting

### MongoDB Connection Error
- Check if MongoDB is running
- Verify `MONGODB_URI` is correct
- For Atlas: Check network access and credentials

### Port Already in Use
- Change `PORT` to another number (e.g., 5001)
- Update `CLIENT_URL` in frontend `.env` if needed

### CORS Errors
- Verify `CLIENT_URL` matches your frontend URL
- Check both backend and frontend are running

