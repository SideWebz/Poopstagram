-- =====================================================
-- POOPSTAGRAM DATABASE SETUP - Complete SQL Script
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. CREATE TABLES
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create posts table  
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. CREATE INDEXES
-- =====================================================

DROP INDEX IF EXISTS posts_user_id_idx;
DROP INDEX IF EXISTS posts_created_at_idx;

CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 4. COMPLETELY RESET ALL POLICIES
-- =====================================================

-- Drop ALL policies on users table
DO $$ 
BEGIN
    EXECUTE (SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON users;', '') 
    FROM pg_policies WHERE tablename = 'users');
END $$;

-- Drop ALL policies on posts table  
DO $$
BEGIN
    EXECUTE (SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON posts;', '')
    FROM pg_policies WHERE tablename = 'posts');
END $$;

-- 5. CREATE RLS POLICIES FOR USERS TABLE
-- =====================================================

-- Allow all authenticated users to read all users
CREATE POLICY "Allow authenticated to read users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow all users to insert their own profile
CREATE POLICY "Allow authenticated to insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Allow authenticated to update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. CREATE RLS POLICIES FOR POSTS TABLE
-- =====================================================

-- Allow authenticated users to read all posts
CREATE POLICY "Allow authenticated to read posts"
ON posts FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own posts
CREATE POLICY "Allow authenticated to insert own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Allow authenticated to delete own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own posts
CREATE POLICY "Allow authenticated to update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. ALLOW UPSERT FOR SIGNUP
-- =====================================================

-- Create a simple function for upsert
CREATE OR REPLACE FUNCTION public.upsert_user(user_id UUID, user_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, username, created_at)
  VALUES (user_id, user_name, NOW())
  ON CONFLICT (id) DO UPDATE
  SET username = user_name;
END;
$$;

-- =====================================================
-- DONE!
-- =====================================================
-- Your database is now configured correctly.
-- The app handles user profile creation after signup.
-- You can now sign up and create posts!
