# How to Create Admin Account

Admin accounts cannot be created through the registration form for security reasons. Use one of the methods below:

## Method 1: Using the Script (Recommended)

Run this command from the **root directory** (`LifeLong`):

```bash
npm run create-admin
```

This will create an admin account with:
- **Email**: `admin@lifelong.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the password immediately after first login!

---

## Method 2: Manual Creation via MongoDB

### Using MongoDB Compass or MongoDB Shell:

1. Connect to your MongoDB database
2. Navigate to the `lifelong` database
3. Go to the `users` collection
4. Insert this document (password is hashed for "admin123"):

```javascript
{
  "name": "Admin",
  "email": "admin@lifelong.com",
  "password": "$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq",
  "role": "admin",
  "isVerified": true,
  "createdAt": new Date()
}
```

**Note**: The password hash above is for "admin123". To create a different password, you'll need to hash it using bcrypt.

### Using Node.js Script:

Create a file `createAdminManual.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const hashedPassword = await bcrypt.hash('your_password_here', 10);
  
  const admin = new User({
    name: 'Admin',
    email: 'admin@lifelong.com',
    password: hashedPassword,
    role: 'admin',
    isVerified: true
  });
  
  await admin.save();
  console.log('Admin created!');
  process.exit(0);
}

createAdmin();
```

---

## Method 3: Using Postman/API (If you add the endpoint)

You could also add a special endpoint for creating the first admin (only if no admin exists). This is not included by default for security.

---

## After Creating Admin Account

1. **Login** with the admin credentials
2. **Access Admin Dashboard** at `/dashboard`
3. **Verify Doctors and Hospitals** that are pending approval
4. **Change Password** (recommended to add a password change feature)

---

## Default Admin Credentials

- **Email**: `admin@lifelong.com`
- **Password**: `admin123`

**⚠️ SECURITY WARNING**: 
- Change the default password immediately!
- Don't use these credentials in production
- Consider using environment variables for admin credentials

---

## Troubleshooting

### Script fails to connect to MongoDB
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `backend/.env`
- Verify the connection string is correct

### Admin already exists
- The script will tell you if an admin already exists
- You can login with existing admin credentials
- Or delete the existing admin and run the script again

### Can't login as admin
- Verify the email and password are correct
- Check that `isVerified` is set to `true` in the database
- Make sure the role is exactly `'admin'` (lowercase)

