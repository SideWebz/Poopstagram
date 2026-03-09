# PoopStagram - Developer Quick Reference

## Quick Start

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Set up .env.local with Supabase credentials
# Copy NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run development server
npm run dev
```

Visit http://localhost:3000

## Available Scripts

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Build for production
npm start        # Run production build
npm run lint     # Run ESLint to find code issues
```

## Project Architecture

### Authentication Flow
1. User signs up/logs in on `/login` or `/signup`
2. `AuthContext` (in `/lib/authContext.tsx`) manages session state
3. All pages check auth status - unauthed users redirected to `/login`
4. `Navbar` component shows logout button when logged in

### Creating a Post
1. User navigates to `/create`
2. `CreatePost` component handles form
3. If image: uploaded to Supabase Storage bucket "posts"
4. Post data + image URL saved to `posts` table
5. User redirected to `/feed`

### Viewing Posts
1. `/feed` fetches all posts from database
2. Posts sorted by `created_at DESC` (newest first)
3. `PostCard` component displays each post
4. Real-time subscription watches for new posts
5. Delete button only shows for post owner

## Key Files to Understand

| File | Purpose |
|------|---------|
| `lib/supabaseClient.ts` | Supabase client setup and types |
| `lib/authContext.tsx` | Global auth state management |
| `components/Navbar.tsx` | Navigation and logout |
| `components/PostCard.tsx` | Individual post display and delete |
| `components/CreatePost.tsx` | Post creation form |
| `app/page.tsx` | Root page (redirects to feed/login) |
| `app/login/page.tsx` | Login form |
| `app/signup/page.tsx` | Sign up form |
| `app/feed/page.tsx` | Main feed |
| `app/create/page.tsx` | Create post page |
| `app/profile/page.tsx` | User profile |

## Database Query Examples

### Fetch All Posts (with user info)
```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    user_id,
    text,
    image_url,
    created_at,
    users:user_id (id, username)
  `)
  .order('created_at', { ascending: false });
```

### Fetch User's Posts
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Delete Post (includes storage cleanup)
```typescript
// 1. Delete from storage if image exists
if (post.image_url) {
  await supabase.storage
    .from('posts')
    .remove([fileName]);
}

// 2. Delete from database
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', post.id);
```

## Common Tasks

### Add a New Page
1. Create folder under `/app` (e.g., `/app/discover`)
2. Create `page.tsx` inside
3. Add route protection:
```typescript
'use client';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const { session, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !session) router.push('/login');
  }, [session, loading, router]);

  if (!session) return <div>Loading...</div>;

  return <div>Your page content</div>;
}
```

### Add a New Component
1. Create file in `/components` (e.g., `UserCard.tsx`)
2. Export as default
3. Use in pages with `import UserCard from '@/components/UserCard'`

### Query Data
```typescript
import { supabase } from '@/lib/supabaseClient';

const { data, error } = await supabase
  .from('table_name')
  .select('*');
```

### Upload a File
```typescript
const { data, error } = await supabase.storage
  .from('posts')
  .upload('file_name.jpg', file);

// Get public URL
const { data: publicUrl } = supabase.storage
  .from('posts')
  .getPublicUrl('file_name.jpg');
```

## Styling

The project uses **Tailwind CSS**. Some key classes used:

```
Spacing: m-4, p-6, mb-4, px-4
Display: flex, grid, block
Colors: bg-pink-600, text-gray-900, border-gray-300
Sizing: w-full, h-96, max-w-2xl
Responsive: sm:, md:, lg: prefixes
States: hover:, disabled:, focus:
```

Learn more: https://tailwindcss.com/docs

## TypeScript Types

Key types defined in `lib/supabaseClient.ts`:

```typescript
type User = {
  id: string;
  username: string;
  created_at: string;
};

type Post = {
  id: string;
  user_id: string;
  text: string;
  image_url: string | null;
  created_at: string;
  user?: User;
};
```

## Environment Variables

These should be in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

`NEXT_PUBLIC_` prefix makes them available in the browser.

## Debugging Tips

### Check Auth State
In browser console:
```javascript
// Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log(session);
```

### Check Network Requests
- Open DevTools (F12)
- Network tab
- Look for supabase requests
- Check response for error messages

### Check Logs
- Browser console for client errors
- Server logs for API issues

## Performance Tips

- Images are cached by Supabase Storage CDN
- Queries are indexed on `user_id` and `created_at`
- Real-time subscriptions only subscribe when needed
- Posts load in reverse chronological order (newest first)

## Security Notes

- Row Level Security (RLS) ensures users can only delete their own posts
- Auth tokens are managed by Supabase
- Images stored in public bucket but referenced only in posts
- Never expose `service_role` key (only use `anon` key)

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hooks](https://react.dev/reference/react)
