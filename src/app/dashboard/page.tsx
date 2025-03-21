'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { OrbField } from '../components/gradients/OrbField';
import { AnimatedText } from '../components/text/AnimatedText';
import Image from 'next/image';

// Add JSX type definitions
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('discover');
  const [profileImage, setProfileImage] = useState('/placeholder-profile.jpg');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar - Desktop Only */}
      <aside className="hidden lg:flex flex-col w-24 bg-white border-r border-gray-100">
        <div className="flex flex-col items-center py-8 space-y-8">
          <Image
            src="/vettly-logo.png"
            alt="Vettly"
            width={80}
            height={80}
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
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/50 to-white" />
        <div className="absolute inset-0">
          <OrbField />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-center p-4 bg-white backdrop-blur-md border-b border-gray-100">
            <Image
              src="/vettly-logo.png"
              alt="Vettly"
              width={120}
              height={120}
              className="rounded-xl"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {/* Welcome Section with Profile Picture */}
            <section className="text-center mt-8 lg:mt-20 mb-8">
              <div className="relative w-64 h-64 md:w-72 md:h-72 mx-auto mb-8 group cursor-pointer" onClick={handleProfileClick}>
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
                    <div className="absolute inset-0 bg-gray-100/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="text-gray-600 text-sm font-medium flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload Photo
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 className="text-7xl font-medium tracking-tight mb-8 text-white font-playfair">
                Welcome back, Sarah
              </h1>
              
              {/* All Cards Container */}
              <div className="max-w-6xl mx-auto px-4">
                {/* Two Column Layout for Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-8">
                  {/* Left Column - Profile Completion and Journey */}
                  <div>
                    {/* Complete Your Profile Section */}
                    <div className="mb-8">
                      <div className="p-6 rounded-xl backdrop-blur-md bg-gradient-to-b from-white/15 to-white/5 shadow-[0_8px_32px_rgb(31,38,135,0.15)] hover:from-white/20 hover:to-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-white text-2xl font-light tracking-wide">Complete Your Profile</h3>
                          <span className="text-purple-400 text-sm font-medium">1 of 2 completed</span>
                        </div>
                        
                        {/* Progress Items */}
                        <div className="space-y-4">
                          <button 
                            onClick={() => window.location.href = '/verification'}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-white text-lg mb-0.5">Profile Setup</h4>
                                <p className="text-white/80 text-sm">Basic information added</p>
                              </div>
                            </div>
                            <span className="text-white ml-4">Done</span>
                          </button>

                          <button 
                            onClick={() => window.location.href = '/questionnaire'}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0 mt-1">
                                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                              </div>
                              <div>
                                <h4 className="text-white text-lg mb-0.5">Complete Questionnaire</h4>
                                <p className="text-white/80 text-sm">Help us understand your preferences</p>
                              </div>
                            </div>
                            <span className="text-white ml-4">Pending</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Your Journey Section */}
                    <div className="mb-8">
                      <div className="p-6 rounded-xl backdrop-blur-md bg-gradient-to-b from-white/15 to-white/5 shadow-[0_8px_32px_rgb(31,38,135,0.15)] hover:from-white/20 hover:to-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                              </svg>
                            </div>
                            <h3 className="text-white text-xl font-medium">Your Journey</h3>
                          </div>
                          <span className="text-purple-400 text-sm font-medium">4 of 7 completed</span>
                        </div>

                        {/* Journey Stages */}
                        <div className="space-y-3">
                          {/* Completed Stages */}
                          <div className="flex items-start justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="flex gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-white text-lg mb-0.5">Profile Created</h4>
                                <p className="text-white/80 text-sm">Your profile is ready</p>
                              </div>
                            </div>
                            <span className="text-white ml-4">Done</span>
                          </div>

                          <div className="flex items-start justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="flex gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-white text-lg mb-0.5">Initial Assessment</h4>
                                <p className="text-white/80 text-sm">Questionnaire completed</p>
                              </div>
                            </div>
                            <span className="text-white ml-4">Done</span>
                          </div>

                          <div className="flex items-start justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="flex gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-white text-lg mb-0.5">Initial Matches</h4>
                                <p className="text-white/80 text-sm">First connections made</p>
                              </div>
                            </div>
                            <span className="text-white ml-4">Done</span>
                          </div>

                          {/* Upcoming Stages */}
                          <div className="flex items-start justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="flex gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0 mt-1">
                                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                              </div>
                              <div>
                                <h4 className="text-white text-lg mb-0.5">First Date</h4>
                                <p className="text-white/80 text-sm">Pending</p>
                              </div>
                            </div>
                            <span className="text-white ml-4">Pending</span>
                          </div>

                          <div className="flex items-start justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="flex gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0 mt-1">
                                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                              </div>
                              <div>
                                <h4 className="text-white text-lg mb-0.5">Feedback Session</h4>
                                <p className="text-white/80 text-sm">Not started</p>
                              </div>
                            </div>
                            <span className="text-white ml-4">Not started</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Messages, Events, Tips */}
                  <div>
                    {/* Messages Section */}
                    <div className="mb-8">
                      <div className="p-6 rounded-xl backdrop-blur-md bg-gradient-to-b from-white/15 to-white/5 shadow-[0_8px_32px_rgb(31,38,135,0.15)] hover:from-white/20 hover:to-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <svg className="w-5 h-5 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <h3 className="text-white text-2xl font-light tracking-wide">Messages</h3>
                          </div>
                          <span className="text-[#34D8F1] text-sm font-medium">2 new</span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                            <div className="relative w-12 h-12">
                              <Image
                                src="/placeholder-profile.jpg"
                                alt="Profile"
                                fill
                                className="rounded-full object-cover"
                              />
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#34D8F1]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium">Emma Thompson</h4>
                                <span className="text-[#34D8F1] text-sm">2m ago</span>
                              </div>
                              <p className="text-white/90 leading-relaxed font-light tracking-wide truncate">Looking forward to our meeting tomorrow!</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                            <div className="relative w-12 h-12">
                              <Image
                                src="/placeholder-profile.jpg"
                                alt="Profile"
                                fill
                                className="rounded-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium">John Davis</h4>
                                <span className="text-white/60 text-sm">1h ago</span>
                              </div>
                              <p className="text-white/90 leading-relaxed font-light tracking-wide truncate">Thanks for the introduction!</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Events Section */}
                    <div className="mb-8">
                      <div className="p-6 rounded-xl backdrop-blur-md bg-gradient-to-b from-white/15 to-white/5 shadow-[0_8px_32px_rgb(31,38,135,0.15)] hover:from-white/20 hover:to-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <svg className="w-5 h-5 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-white text-2xl font-light tracking-wide">Upcoming Events</h3>
                          </div>
                          <span className="text-[#34D8F1] text-sm font-medium">This Week</span>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-medium">Speed Dating Event</h4>
                              <span className="text-white/60 text-sm">Tomorrow</span>
                            </div>
                            <p className="text-white/90 leading-relaxed font-light tracking-wide mb-3">Join us for an evening of meaningful connections</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white/60">6:00 PM</span>
                              <span className="text-white/40">•</span>
                              <span className="text-white/60">The Grand Hotel</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-medium">Matchmaking Workshop</h4>
                              <span className="text-white/60 text-sm">Next Week</span>
                            </div>
                            <p className="text-white/90 leading-relaxed font-light tracking-wide mb-3">Learn about our matchmaking process</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white/60">2:00 PM</span>
                              <span className="text-white/40">•</span>
                              <span className="text-white/60">Virtual Event</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Daily Matchmaking Tip */}
                    <div className="mb-8">
                      <div className="p-6 rounded-xl backdrop-blur-md bg-gradient-to-b from-white/15 to-white/5 shadow-[0_8px_32px_rgb(31,38,135,0.15)] hover:from-white/20 hover:to-white/10 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <svg className="w-5 h-5 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h3 className="text-white text-2xl font-light tracking-wide">Daily Tip</h3>
                        </div>
                        <p className="text-white/90 leading-relaxed font-light tracking-wide">
                          Take time to reflect on your values and what matters most to you in a relationship. This self-awareness will help you make better connections and find more meaningful matches.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
