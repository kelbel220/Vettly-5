'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface MobileNavigationProps {
  activeTab: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab }) => {
  const router = useRouter();
  const auth = useAuth();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-center py-2 px-4 bg-[#34D8F1]/95 backdrop-blur-xl border-t border-white/10 z-50">
      <div className="flex gap-4 justify-center w-full overflow-x-auto px-2">
        {/* Dashboard Button */}
        <button
          type="button"
          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
            activeTab === 'dashboard'
              ? 'bg-white/25 text-white'
              : 'text-white hover:text-white hover:bg-white/20'
          }`}
          onClick={() => {
            router.push('/dashboard');
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1 capitalize">Home</span>
        </button>
        
        {/* Profile Button */}
        <button
          type="button"
          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
            activeTab === 'profile'
              ? 'bg-white/25 text-white'
              : 'text-white hover:text-white hover:bg-white/20'
          }`}
          onClick={() => {
            router.push('/profile');
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-xs mt-1 capitalize">Profile</span>
        </button>
        
        {/* Messages Button */}
        <button
          type="button"
          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
            activeTab === 'messages'
              ? 'bg-white/25 text-white'
              : 'text-white hover:text-white hover:bg-white/20'
          }`}
          onClick={() => {
            router.push('/messages');
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-xs mt-1 capitalize">Messages</span>
        </button>
        
        {/* Matches Button */}
        <button
          type="button"
          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
            activeTab === 'matches'
              ? 'bg-white/25 text-white'
              : 'text-white hover:text-white hover:bg-white/20'
          }`}
          onClick={() => {
            router.push('/matches');
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span className="text-xs mt-1 capitalize">Matches</span>
        </button>
        
        {/* Settings Button */}
        <button
          type="button"
          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
            activeTab === 'settings'
              ? 'bg-white/25 text-white'
              : 'text-white hover:text-white hover:bg-white/20'
          }`}
          onClick={() => {
            router.push('/settings');
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span className="text-xs mt-1 capitalize">Settings</span>
        </button>
        
        {/* Logout Button */}
        <button
          type="button"
          className="flex flex-col items-center p-2 rounded-lg transition-all text-white hover:text-white hover:bg-white/20"
          onClick={() => {
            auth.logout().then(() => {
              router.push('/login');
            });
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="#3B00CC" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs mt-1 capitalize">Logout</span>
        </button>
      </div>
    </div>
  );
};
