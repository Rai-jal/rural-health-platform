# 📦 Setup Supabase Storage Bucket for Admin Documents

## Quick Setup

To enable document uploads in the admin dashboard, you need to create a storage bucket in Supabase.

### Step 1: Go to Storage

1. Open your Supabase Dashboard
2. Go to: **Storage** (in the left sidebar)
3. Or visit: https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/storage/buckets

### Step 2: Create Bucket

1. Click **"New bucket"** button
2. Fill in:
   - **Name:** `admin-documents`
   - **Public bucket:** ✅ **Check this** (so files can be accessed via URL)
   - **File size limit:** `50 MB` (or your preferred limit)
   - **Allowed MIME types:** Leave empty for all types, or specify:
     - `application/pdf`
     - `image/*`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
3. Click **"Create bucket"**

### Step 3: Set Up RLS Policies

1. Click on the `admin-documents` bucket
2. Go to **"Policies"** tab
3. Click **"New policy"**

#### Policy 1: Admins can upload files

```sql
-- Policy name: "Admins can upload files"
-- Allowed operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);
```

#### Policy 2: Admins can read files

```sql
-- Policy name: "Admins can read files"
-- Allowed operation: SELECT
-- Target roles: authenticated

CREATE POLICY "Admins can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);
```

#### Policy 3: Admins can delete files

```sql
-- Policy name: "Admins can delete files"
-- Allowed operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);
```

### Step 4: Verify Setup

1. Go back to your admin dashboard
2. Click on **"Documents"** tab
3. Try uploading a file
4. It should work! ✅

---

## Alternative: Simpler Policy (If Above Doesn't Work)

If you get recursion errors, use this simpler approach:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;

-- Use the is_admin function we created earlier
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-documents' AND
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-documents' AND
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-documents' AND
  public.is_admin(auth.uid())
);
```

---

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created the bucket with exact name: `admin-documents`
- Check it's set to **Public**

### Error: "Permission denied"
- Check RLS policies are created
- Verify you're logged in as Admin
- Check the policy conditions match your user ID

### Files not showing up
- Check bucket is **Public**
- Verify file was uploaded successfully
- Check browser console for errors

---

**Last Updated:** Current session

