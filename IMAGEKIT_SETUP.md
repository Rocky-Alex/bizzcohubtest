# ImageKit Integration Setup Guide

## Overview
Product images are now stored on ImageKit CDN instead of being saved as base64 in the database. This provides:
- ✅ **Faster loading times** - Images served via CDN
- ✅ **Automatic optimization** - ImageKit optimizes images automatically
- ✅ **Image transformations** - Resize, crop, and format images on-the-fly
- ✅ **Better performance** - Reduced database size
- ✅ **Scalability** - Handle unlimited images

## Setup Instructions

### 1. Create ImageKit Account
1. Go to [ImageKit.io](https://imagekit.io/)
2. Sign up for a free account
3. Complete the registration process

### 2. Get Your ImageKit Credentials
After logging in to your ImageKit dashboard:

1. **Public Key**: 
   - Go to **Developer Options** → **API Keys**
   - Copy your **Public Key**

2. **Private Key**:
   - In the same section, copy your **Private Key**
   - ⚠️ Keep this secret and never expose it in client-side code

3. **URL Endpoint**:
   - Go to **Settings** → **URL Endpoint**
   - Copy your URL endpoint (format: `https://ik.imagekit.io/your_imagekit_id`)

### 3. Configure Environment Variables
Add the following to your `.env.local` file:

```bash
# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Notes:**
- Replace `your_public_key_here`, `your_private_key_here`, and `your_imagekit_id` with your actual credentials
- The `NEXT_PUBLIC_` prefix makes variables accessible in the browser (only for public key and URL endpoint)
- Never expose your private key in client-side code
- For production, update `NEXT_PUBLIC_APP_URL` to your production domain

### 4. Restart Development Server
After adding the environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## How It Works

### Image Upload Flow
1. **Admin uploads images** in the product form
2. **Images are sent to ImageKit** via API
3. **ImageKit returns URLs** for the uploaded images
4. **URLs are stored in database** (comma-separated)
5. **Product detail page displays images** from ImageKit CDN

### File Structure
```
src/
├── lib/
│   └── imagekit.ts                    # ImageKit configuration & helpers
├── app/
│   └── api/
│       ├── imagekit/
│       │   ├── auth/route.ts          # Authentication endpoint
│       │   └── upload/route.ts        # Upload/delete endpoint
│       └── products/route.ts          # Updated to handle ImageKit URLs
└── components/
    └── admin/
        └── ProductForm.tsx            # Updated with ImageKit upload
```

### API Endpoints

#### `/api/imagekit/auth` (GET)
Returns authentication parameters for client-side uploads.

#### `/api/imagekit/upload` (POST)
Uploads an image to ImageKit.

**Request:**
```json
{
  "file": "base64_string",
  "fileName": "product-image.jpg",
  "folder": "products"
}
```

**Response:**
```json
{
  "url": "https://ik.imagekit.io/your_id/products/product-image.jpg",
  "fileId": "unique_file_id"
}
```

#### `/api/imagekit/upload?fileId=xxx` (DELETE)
Deletes an image from ImageKit.

## Database Schema

### Products Table - Image Field
The `image` field now stores:
- **Single image**: `https://ik.imagekit.io/your_id/products/image1.jpg`
- **Multiple images**: `https://ik.imagekit.io/your_id/products/image1.jpg,https://ik.imagekit.io/your_id/products/image2.jpg`

Images are stored as comma-separated URLs and parsed into an array when retrieved.

## Features

### Multiple Image Upload
- Upload up to 5 images per product
- First image is marked as "Main"
- Visual gallery with thumbnails
- Remove individual images
- Loading indicator during upload

### Image Optimization
ImageKit automatically:
- Compresses images
- Converts to modern formats (WebP, AVIF)
- Serves responsive images
- Caches images globally

### Image Transformations
You can transform images on-the-fly by modifying the URL:

```javascript
// Original
https://ik.imagekit.io/your_id/products/image.jpg

// Resize to 400x400
https://ik.imagekit.io/your_id/tr:w-400,h-400/products/image.jpg

// Resize and convert to WebP
https://ik.imagekit.io/your_id/tr:w-400,h-400,f-webp/products/image.jpg
```

## Troubleshooting

### Images not uploading?
1. Check environment variables are set correctly
2. Verify ImageKit credentials are valid
3. Check browser console for errors
4. Ensure file size is under 5MB

### Images not displaying?
1. Verify URLs are stored correctly in database
2. Check ImageKit dashboard for uploaded files
3. Ensure URL endpoint is correct
4. Check browser network tab for failed requests

### Authentication errors?
1. Verify private key is correct
2. Check `/api/imagekit/auth` endpoint is accessible
3. Ensure environment variables are loaded (restart server)

## Migration from Base64

If you have existing products with base64 images:
1. The system will continue to display them
2. When editing a product, you can upload new ImageKit images
3. Old base64 images can be gradually replaced

## Free Tier Limits

ImageKit free tier includes:
- **20 GB bandwidth/month**
- **20 GB storage**
- **Unlimited transformations**
- **Unlimited requests**

This is sufficient for most small to medium applications.

## Production Deployment

Before deploying to production:
1. Add ImageKit environment variables to your hosting platform
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Consider upgrading ImageKit plan if needed
4. Set up custom domain for ImageKit (optional)

## Support

For ImageKit-specific issues:
- Documentation: https://docs.imagekit.io/
- Support: https://imagekit.io/support/

For application issues:
- Check the console logs
- Verify API endpoints are working
- Test with a simple image upload first
