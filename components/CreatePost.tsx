'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';

export default function CreatePost() {
  const { session } = useAuth();
  const router = useRouter();
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError('Please write something!');
      return;
    }

    if (!session) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (image) {
        const timestamp = Date.now();
        const fileName = `${session.user.id}-${timestamp}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const { error: postError } = await supabase.from('posts').insert([
        {
          user_id: session.user.id,
          text: text.trim(),
          image_url: imageUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (postError) throw postError;

      router.push('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">Create Post</h2>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-sm border border-red-200">{error}</div>}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind? Share your thoughts..."
        className="w-full px-4 py-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 resize-none text-slate-900 placeholder-slate-400 text-sm"
        rows={5}
        disabled={loading}
      />

      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Add image (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={loading}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {preview && (
        <div className="mb-4 relative w-full h-64 rounded-lg overflow-hidden border border-slate-200">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1 bg-slate-200 text-slate-800 font-semibold py-3 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
