'use client';

import { OrbField } from '../components/gradients/OrbField';
import { AnimatedText } from '../components/text/AnimatedText';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('discover');
  const [profileImage, setProfileImage] = useState('/placeholder-profile.jpg');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#6600FF] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#000B2A] flex">
      {/* Left Sidebar - Desktop Only */}
      <aside className="hidden lg:flex flex-col w-20 bg-[#6B46C1] border-r border-white/10">
        <div className="flex flex-col items-center py-8 space-y-8">
          <Image
            src="/vettly-logo.png"
            alt="Vettly"
            width={40}
            height={40}
            className="rounded-xl"
          />
          {['discover', 'matches', 'messages', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`p-3 rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-[#34D8F1]/20 text-[#34D8F1]'
                  : 'text-[#34D8F1]/70 hover:text-[#34D8F1] hover:bg-[#34D8F1]/10'
              }`}
            >
              {tab === 'discover' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {tab === 'matches' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {tab === 'messages' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
              {tab === 'profile' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6B46C1]/95 via-[#9333EA]/90 to-[#6B46C1]/70" />
        <div className="absolute inset-0">
          <OrbField />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white/5 backdrop-blur-md border-b border-white/10">
            <Image
              src="/vettly-logo.png"
              alt="Vettly"
              width={32}
              height={32}
              className="rounded-xl"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {/* Welcome Section with Profile Picture */}
            <section className="text-center mt-8 lg:mt-20 mb-8">
              <div className="relative w-32 h-32 md:w-60 md:h-60 mx-auto mb-8 group cursor-pointer" onClick={handleProfileClick}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="w-full h-full relative">
                    <Image
                      src={profileImage}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="text-white text-sm font-medium flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload Photo
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <AnimatedText 
                text="WELCOME BACK, SARAH" 
                className="text-3xl md:text-4xl font-light tracking-[0.08em] text-white mb-2 text-center uppercase"
                delay={0.1}
              />
            </section>

            {/* Quick Stats - Detailed Cards */}
            <section className="max-w-3xl mx-auto px-4 mt-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Messages Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <svg className="w-4 h-4 text-[#00FFDD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-white text-lg font-medium">Messages</h3>
                    <span className="ml-auto text-3xl text-white/90 font-light">0</span>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-white/60 text-sm">No new messages yet</p>
                  </div>
                </div>

                {/* Events Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <svg className="w-4 h-4 text-[#00FFDD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-white text-lg font-medium">Events</h3>
                    <span className="ml-auto text-3xl text-white/90 font-light">0</span>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-white/60 text-sm">No upcoming events</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Mobile Navigation */}
          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/5 backdrop-blur-md border-t border-white/10">
            <div className="flex justify-around p-3">
              {['discover', 'matches', 'messages', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === tab ? 'text-[#34D8F1]' : 'text-white/80'
                  }`}
                >
                  {tab === 'discover' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {tab === 'matches' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  {tab === 'messages' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                  {tab === 'profile' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </main>
    </div>
  );
} 