# ImageKit Setup - Quick Start Guide

## 🎯 Your ImageKit Credentials

```
Public Key:  public_g42DWEqY1R/8z+j7SFlv6KNuLdo=
Private Key: private_9ALMbOBNb1sNMnb5lt5Pdy1e/WA=
URL Endpoint: https://ik.imagekit.io/kxci2a0h5
```

---

## ⚡ Quick Setup (Choose One Method)

### Method 1: Automated Script (Recommended)

Run this PowerShell script to automatically update your `.env.local`:

```powershell
.\update-imagekit-env.ps1
```

This will:
- ✅ Check if `.env.local` exists
- ✅ Add or update ImageKit credentials
- ✅ Create `.env.local` from `.env.example` if needed
- ✅ Provide clear feedback

### Method 2: Manual Setup

1. **Open** `d:\Bizzcohub\.env.local` in your editor
2. **Add** these lines (or update existing ones):

```bash
# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_g42DWEqY1R/8z+j7SFlv6KNuLdo=
IMAGEKIT_PRIVATE_KEY=private_9ALMbOBNb1sNMnb5lt5Pdy1e/WA=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/kxci2a0h5
```

3. **Save** the file

---

## 🧪 Test Your Configuration

### Step 1: Restart Dev Server

Stop and restart your development server to load the new environment variables:

```powershell
# Press Ctrl+C to stop the current server, then:
npm run dev
```

### Step 2: Test the Configuration

Open your browser and navigate to:

```
http://localhost:3001/api/imagekit/test
```

You should see a JSON response like:

```json
{
  "status": "configured",
  "config": {
    "publicKeySet": true,
    "privateKeySet": true,
    "urlEndpointSet": true,
    "publicKey": "public_g42...",
    "urlEndpoint": "https://ik.imagekit.io/kxci2a0h5"
  },
  "authTest": {
    "success": true,
    "error": ""
  },
  "message": "✅ ImageKit is properly configured!"
}
```

✅ **If you see this**, ImageKit is working correctly!

❌ **If you see errors**, check:
- Did you save `.env.local`?
- Did you restart the dev server?
- Are the credentials exactly as shown above?

---

## 🎨 Test Image Upload

Once configured, test uploading an image:

1. **Navigate to Admin Panel**:
   ```
   http://localhost:3001/admin/products
   ```

2. **Create or Edit a Product**

3. **Upload an Image**:
   - Click the image upload area
   - Select an image file
   - Wait for upload confirmation

4. **Verify in ImageKit Dashboard**:
   - Go to: https://imagekit.io/dashboard
   - Check the "Media Library"
   - Your uploaded image should appear in the `products` folder

---

## 📁 Files Updated

| File | Status | Description |
|------|--------|-------------|
| `.env.example` | ✅ Updated | Contains your ImageKit credentials as reference |
| `update-imagekit-env.ps1` | ✅ Created | Automated setup script |
| `src/app/api/imagekit/test/route.ts` | ✅ Created | Configuration test endpoint |
| `IMAGEKIT_CREDENTIALS.md` | ✅ Created | Detailed setup guide |
| `.env.local` | ⚠️ **ACTION REQUIRED** | You need to update this manually or run the script |

---

## 🔧 How It Works

### Architecture

```
┌─────────────────┐
│  Admin Panel    │
│  (Upload Form)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Route      │
│  /api/imagekit/ │
│  upload         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ImageKit SDK   │
│  (lib/imagekit) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ImageKit CDN   │
│  (Cloud Storage)│
└─────────────────┘
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/imagekit/auth` | GET | Get authentication parameters |
| `/api/imagekit/upload` | POST | Upload image to ImageKit |
| `/api/imagekit/upload?fileId=xxx` | DELETE | Delete image from ImageKit |
| `/api/imagekit/test` | GET | Test configuration |

---

## 🔐 Security Notes

### ✅ Safe to Expose (Client-Side)
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` - Public key for client-side authentication
- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` - Your ImageKit URL endpoint

### 🔒 Keep Secret (Server-Side Only)
- `IMAGEKIT_PRIVATE_KEY` - **NEVER** expose this to the client
- Only used in API routes and server-side code
- Already properly configured in `src/lib/imagekit.ts`

### 🛡️ Protection Measures
- ✅ `.env.local` is in `.gitignore` (won't be committed)
- ✅ Private key only used in server-side code
- ✅ API routes validate requests before processing
- ✅ Test endpoint doesn't expose full credentials

---

## 🐛 Troubleshooting

### Issue: "ImageKit not configured" error

**Symptoms**: Error in console or API response

**Solutions**:
1. Check if `.env.local` has all three variables
2. Restart the dev server after updating `.env.local`
3. Run the test endpoint: `http://localhost:3001/api/imagekit/test`
4. Check for typos in variable names (they're case-sensitive!)

### Issue: Upload fails with 401 Unauthorized

**Symptoms**: Upload returns 401 error

**Solutions**:
1. Verify credentials in ImageKit dashboard
2. Check if credentials in `.env.local` match exactly
3. Ensure no extra spaces or quotes around values
4. Try regenerating keys in ImageKit dashboard

### Issue: Images not appearing

**Symptoms**: Upload succeeds but images don't show

**Solutions**:
1. Check ImageKit dashboard media library
2. Verify the URL endpoint is correct
3. Check browser console for CORS errors
4. Ensure `next.config.js` has ImageKit domain configured

### Issue: Test endpoint shows "not_configured"

**Symptoms**: `/api/imagekit/test` returns error status

**Solutions**:
1. **First**, update `.env.local` with credentials
2. **Then**, restart dev server completely
3. **Finally**, test again

---

## 📚 Additional Resources

- **ImageKit Documentation**: https://docs.imagekit.io/
- **ImageKit Dashboard**: https://imagekit.io/dashboard
- **Your Media Library**: https://imagekit.io/dashboard/media-library
- **API Reference**: https://docs.imagekit.io/api-reference/api-introduction

---

## ✅ Checklist

Before you start using ImageKit, make sure:

- [ ] `.env.local` has all three ImageKit variables
- [ ] Dev server has been restarted
- [ ] Test endpoint returns "configured" status
- [ ] You can access ImageKit dashboard
- [ ] `next.config.js` has ImageKit domain configured (already done ✅)

---

## 🚀 Next Steps

1. **Update `.env.local`** (use script or manual method)
2. **Restart dev server**
3. **Run test endpoint** to verify
4. **Try uploading** an image in admin panel
5. **Check ImageKit dashboard** to see your images

---

**Need Help?** Check `IMAGEKIT_CREDENTIALS.md` for detailed documentation.

**Status**: ✅ All files created and ready to use!
