## Troubleshooting Product Creation Error

The product creation is failing with a 500 error. Here's how to diagnose it:

### Step 1: Check Server Console

Look at the terminal where `npm run dev` is running. After trying to create a product, you should see detailed error logs like:

```
Error creating product: [error message]
Error details: {
  message: "...",
  code: "...",
  detail: "...",
  stack: "..."
}
```

### Step 2: Common Issues & Solutions

#### Issue 1: Missing `colors` Column
**Error:** `column "colors" does not exist`
**Solution:** Run this SQL in Neon Dashboard:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT;
```

#### Issue 2: Missing `date_added` Field
**Error:** `null value in column "date_added"`
**Solution:** The form might not be sending `date_added`. Check if the form includes it.

#### Issue 3: ImageKit Upload Failing
**Error:** Images not uploading to ImageKit
**Solution:** 
- Check ImageKit credentials in `.env.local`
- Restart the dev server
- Try uploading without images first

#### Issue 4: Database Connection
**Error:** `Connection refused` or `POSTGRES_URL not set`
**Solution:**
- Check `.env.local` has `POSTGRES_URL` or `DATABASE_URL`
- Restart dev server

### Step 3: Test Without Images

Try creating a product WITHOUT uploading images first:
1. Go to Add Laptop
2. Skip the image upload
3. Fill in all other fields
4. Save

If this works, the issue is with ImageKit integration.

### Step 4: Check Browser Console

Open browser DevTools (F12) → Console tab
Look for any errors related to:
- Image upload failures
- Network errors
- JavaScript errors

### Step 5: Manual Database Test

Test if you can insert directly into the database:

```sql
INSERT INTO products (
  code, name, brand, price, offer_price, stock, condition, 
  discount, type, category, image, date_added
) VALUES (
  'TEST-001', 'Test Laptop', 'Test Brand', 1000, 900, 10, 
  'New', 10, 'laptop', 'Test', 'https://example.com/image.jpg', 
  CURRENT_DATE
);
```

If this works, the issue is in the API code.

### Need Help?

Please share:
1. **Server console output** (the detailed error from Step 1)
2. **Browser console errors** (if any)
3. **What you were trying to do** (with/without images, which fields filled)

This will help identify the exact issue!
