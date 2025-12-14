# Cloudinary Setup Guide

## What is Cloudinary?

Cloudinary is a cloud-based image and video management service that handles file uploads, storage, and delivery.

## Why Use Cloudinary?

- **No local storage needed** - Files stored in cloud
- **Automatic optimization** - Images are optimized automatically
- **CDN delivery** - Fast global delivery
- **Free tier available** - 25GB storage, 25GB bandwidth/month

## Setup Steps

### Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com/
2. Click "Sign Up" (free account)
3. Complete registration

### Step 2: Get Your Credentials

After signing up, you'll see your dashboard with:
- **Cloud Name**
- **API Key**
- **API Secret**

### Step 3: Add to Backend .env

Add these to your `backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Step 4: Install Dependencies

The Cloudinary package is already added to `package.json`. Just run:

```bash
npm install
```

## Usage

The system automatically uses Cloudinary for:
- **Doctor license document uploads** (during registration)
- **Chat image/file uploads**

Files are uploaded to Cloudinary and URLs are stored in the database.

## Testing

After setup, test by:
1. Registering as a doctor with license image
2. Uploading an image in chat

If uploads work, Cloudinary is configured correctly!

## Troubleshooting

### "Invalid API credentials" error
- Check your `.env` file has correct credentials
- Verify credentials in Cloudinary dashboard
- Make sure there are no extra spaces in `.env` values

### Upload fails
- Check file size (max 10MB)
- Verify file type is allowed (images, PDF, DOC, etc.)
- Check Cloudinary dashboard for errors

### Files not displaying
- Check if fileUrl is saved correctly in database
- Verify Cloudinary URL is accessible
- Check browser console for errors

