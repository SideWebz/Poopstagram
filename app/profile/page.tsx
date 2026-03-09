'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase, Post } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import Navbar from '@/components/Navbar';

export default function ProfilePage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; created_at: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [session, authLoading, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session) return;

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, created_at')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;
        setUserInfo(userData);

        const { data: postsData, error: postsError } = await supabase
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
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        const formattedPosts = postsData.map((post: any) => ({
          ...post,
          user: post.users?.[0] || null,
        }));

        setPosts(formattedPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  if (authLoading || !session) {
    return <div className="flex items-center justify-center min-h-screen text-slate-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {userInfo?.username || 'Profile'}
          </h1>
          <p className="text-slate-600 text-sm">
            Member since{' '}
            {userInfo?.created_at
              ? new Date(userInfo.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })
              : 'Recently'}
          </p>
          <p className="text-slate-600 text-sm mt-2">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {/* Posts Section */}
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Posts</h2>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-600">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-600 py-12 bg-white rounded-lg border border-slate-200">
            <p>You haven't posted anything yet.</p>
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
