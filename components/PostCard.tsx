'use client';

import { Post } from '@/lib/supabaseClient';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';
import Image from 'next/image';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { session } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = session?.user?.id === post.user_id;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setIsDeleting(true);
    setError(null);

    try {
      if (post.image_url) {
        const fileName = post.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('posts')
            .remove([fileName]);
        }
      }

      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (deleteError) throw deleteError;

      onDelete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">{post.user?.username || 'User'}</h3>
          <p className="text-xs text-slate-500 mt-1">{formatDate(post.created_at)}</p>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 disabled:opacity-50 transition text-sm font-medium"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-xs mb-3 bg-red-50 p-2 rounded">{error}</p>}

      <p className="text-slate-800 mb-3 whitespace-pre-wrap leading-relaxed text-sm">{post.text}</p>

      {post.image_url && (
        <div className="relative w-full h-64 mb-3 rounded-lg overflow-hidden bg-slate-100">
          <Image
            src={post.image_url}
            alt="Post image"
            fill
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}
