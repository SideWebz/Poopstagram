# PoopStagram - Social Media App

A mobile-first social media web app built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **User Authentication**: Email/password signup and login with Supabase Auth
- 📝 **Create Posts**: Share text and optional images with friends
- 📸 **Image Upload**: Store images in Supabase Storage
- 📱 **Responsive Feed**: View posts from all users ordered by newest first
- 👤 **User Profiles**: View your own posts and profile information
- 🗑️ **Delete Posts**: Remove only your own posts
- 🛡️ **Route Protection**: Only authenticated users can access the main app

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## Project Structure

```
/app
  /login          - Login page
  /signup         - Sign up page
  /feed           - Main feed showing all posts
  /create         - Create new post page
  /profile        - User profile and their posts
  layout.tsx      - Root layout with AuthProvider
  page.tsx        - Home page (redirects to feed or login)

/components
  Navbar.tsx      - Navigation bar component
  PostCard.tsx    - Individual post display component
  CreatePost.tsx  - Post creation form component

/lib
  supabaseClient.ts   - Supabase client initialization
  authContext.tsx     - Authentication context and hooks

/public            - Static assets
```

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier available at https://supabase.com)

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to initialize
5. Copy your project URL and Anon Key from the API settings

### 2. Create Database Tables

In your Supabase project, go to the SQL Editor and run the following SQL:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
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

-- Create index for faster queries
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read all posts
CREATE POLICY "Allow public read access to posts"
ON posts FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own posts
CREATE POLICY "Allow users to insert their own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Allow users to delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to read all user profiles
CREATE POLICY "Allow public read access to users"
ON users FOR SELECT
TO authenticated
USING (true);
```

### 3. Create Storage Bucket

1. Go to Storage in your Supabase project
2. Click "New bucket"
3. Name it `posts` and make it **public**

### 4. Setup Environment Variables

1. Copy `.env.local` (already in the project)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project settings:
- URL: Project > Settings > API > URL
- Anon Key: Project > Settings > API > Anon Key (public)

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Sign Up
1. Go to the signup page
2. Enter a username, email, and password (min 6 characters)
3. Click "Sign up"
4. You'll be redirected to the feed

### Create a Post
1. Click "Create" in the navigation bar
2. Write your message in the text area
3. (Optional) Upload an image
4. Click "Post"

### View Feed
1. Posts are displayed in reverse chronological order (newest first)
2. Shows the author's username, timestamp, text, and image (if exists)
3. Your posts show a "Delete" button

### View Profile
1. Click "Profile" in the navigation bar
2. See your member date and post count
3. View only your own posts

### Delete a Post
1. Click "Delete" on any of your posts
2. Confirm the deletion
3. The post and image (if any) are removed

### Logout
1. Click the "Menu" dropdown in the top-right
2. Click "Logout"
3. You'll be redirected to the login page

## Building for Production

```bash
npm run build
npm run start
```

Or deploy directly to Vercel, Netlify, or another Next.js-compatible platform.

## Environment Variables

Required environment variables (in `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous public key

## API & Database Notes

- Posts are stored with `created_at` timestamps in ISO format
- Images are stored in Supabase Storage bucket named `posts`
- User-post relationship is enforced with foreign keys in the database
- Row Level Security (RLS) policies ensure users can only delete their own posts
- Real-time updates to the feed use Supabase's PostgreSQL change notifications

## Troubleshooting

### "Could not create a project called..." error
- Ensure your project folder name contains only lowercase letters and numbers

### Images not uploading
- Check that the `posts` storage bucket is public
- Verify CORS settings in Supabase Storage
- Check browser console for specific errors

### Authentication not working
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Clear browser cache and cookies
- Check that the users table exists and has the correct schema

### Posts not loading
- Verify the `posts` table exists with correct columns
- Check that RLS policies are enabled correctly
- Ensure you're logged in (check auth state in browser DevTools)

## License

MIT

## Next Steps

- Add user follow/unfollow functionality
- Add likes/hearts to posts
- Add comments on posts
- Add image cropping before upload
- Add dark mode toggle
- Add post search functionality
- Add post filtering by hashtags

