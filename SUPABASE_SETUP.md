# PoopStagram - Supabase Setup Guide

This guide walks through setting up your Supabase project to work with PoopStagram.

## Step 1: Create Supabase Account and Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up or log in with GitHub/email
4. Click "New project"
5. Fill in:
   - **Name**: Any name (e.g., "poopstagram")
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
6. Click "Create new project" and wait 1-2 minutes for initialization

## Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Settings** (gear icon) → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **Anon (public)** key (under "Project API keys")
3. Open `.env.local` in your PoopStagram project and paste:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Create Database Tables

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the entire SQL code below
4. Click "Run" at the bottom

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create posts table  
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Allow public read access to users"
ON users FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for posts table
CREATE POLICY "Allow public read access to posts"
ON posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
```

## Step 4: Create Storage Bucket

1. In Supabase, go to **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Name it: `posts` (exactly this)
4. **IMPORTANT**: Click the **Public** checkbox to make it public
5. Click "Create bucket"

## Step 5: Test the Setup

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. You should see the login page. Try:
   - Signing up with an email and password
   - Creating a post
   - Uploading an image

## Troubleshooting

### "Connection refused" or blank page
- Check your `.env.local` has correct URL and key
- Reload the page (hard refresh: Ctrl+Shift+R)

### Images not uploading
- Make sure the `posts` bucket is **Public** (not private)
- Check the bucket name is exactly `posts` (lowercase)
- Go to Storage settings and verify CORS isn't blocking your local domain

### Can't sign up
- The email must be valid (Supabase sends verification emails)
- Password must be at least 6 characters
- Check browser console for specific error messages

### Posts not appearing
- Check the `posts` table exists in Database
- Verify you're logged in (check the page doesn't redirect to login)
- Go to Database → `posts` table and check if rows are being created

### "Row level security (RLS) is not enabled" error
- Log into Supabase
- Go to Authentication → Policies
- Make sure RLS policies are enabled for both `users` and `posts` tables

## Optional: Enable Email Confirmation

For production, you should enable email verification:

1. Go to **Authentication** → **Email Templates**
2. The default template is fine for testing
3. Users will receive a confirmation email when they sign up

## Optional: Set Password Reset Email

1. Go to **Authentication** → **Email Templates**
2. Look for the password reset template
3. Customize if needed (default should work)

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add `.env.local` variables to your hosting platform's environment variables
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In Supabase, go to **Project Settings** → **URL Configuration**
4. Add your production URL to the allowed URLs list

## More Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
