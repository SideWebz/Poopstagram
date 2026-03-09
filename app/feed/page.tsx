'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase, Post } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import Navbar from '@/components/Navbar';

export default function FeedPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [session, authLoading, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select(
            `
            id,
            user_id,
            text,
            image_url,
            created_at,
            users:user_id (
              id,
              username,
              created_at
            )
          `
          )
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const formattedPosts = data.map((post: any) => ({
          ...post,
          user: post.users?.[0] || null,
        }));

        setPosts(formattedPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchPosts();

      const subscription = supabase
        .channel('posts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'posts' },
          () => {
            fetchPosts();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session]);

  if (authLoading || !session) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Feed</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-600 py-12">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-600 py-12 bg-white rounded-lg border border-slate-200">
            <p>No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={() => setPosts(posts.filter((p) => p.id !== post.id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
