'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';

export default function Navbar() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/feed" className="text-2xl font-bold text-slate-900">
            PoopStagram
          </Link>

          <div className="hidden sm:flex gap-6 items-center text-sm font-medium">
            <Link
              href="/feed"
              className="text-slate-700 hover:text-blue-600 transition"
            >
              Feed
            </Link>
            <Link
              href="/create"
              className="text-slate-700 hover:text-blue-600 transition"
            >
              Create
            </Link>
            <Link
              href="/profile"
              className="text-slate-700 hover:text-blue-600 transition"
            >
              Profile
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-slate-700 hover:text-blue-600 transition"
              >
                Menu
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 text-slate-700"
            >
              ☰
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <Link
                  href="/feed"
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm rounded-t-lg"
                >
                  Feed
                </Link>
                <Link
                  href="/create"
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm"
                >
                  Create
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-b-lg text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
