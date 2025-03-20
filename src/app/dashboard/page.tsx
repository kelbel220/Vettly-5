'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { OrbField } from '../components/gradients/OrbField';
import { AnimatedText } from '../components/text/AnimatedText';
import Image from 'next/image';

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
      <div className="min-h-screen bg-[#6600FF] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#7600FF] flex">
      {/* Left Sidebar - Desktop Only */}
      <aside className="hidden lg:flex flex-col w-24 bg-[#7600FF] border-r border-white/10">
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#7600FF]/95 via-[#9333EA]/90 to-[#7600FF]/70" />
        <div className="absolute inset-0">
          <OrbField />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-center p-4 bg-white/5 backdrop-blur-md border-b border-white/10">
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
                className="text-3xl md:text-4xl font-light tracking-[0.08em] text-white mb-8 text-center uppercase"
                delay={0.1}
              />
              
              {/* All Cards Container */}
              <div className="max-w-6xl mx-auto px-4">
                {/* Two Column Layout for Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
                  {/* Left Column - Profile Completion */}
                  <div>
                    {/* Complete Your Profile Section */}
                    <div className="mb-8">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white text-2xl font-medium">Complete Your Profile</h3>
                          <span className="text-[#34D8F1] text-sm">1 of 2 completed</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-white/10 rounded-full mb-6">
                          <div className="h-full bg-gradient-to-r from-[#34D8F1] to-[#7600FF] rounded-full" style={{ width: '50%' }} />
                        </div>

                        {/* Checklist Items */}
                        <div className="space-y-4">
                          <button 
                            onClick={() => window.location.href = '/verification'}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/20"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-[#34D8F1] flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-white">Get Verified</span>
                            </div>
                            <span className="text-[#34D8F1] text-sm">Completed</span>
                          </button>

                          <button 
                            onClick={() => window.location.href = '/questionnaire'}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/20"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white/30 rounded-full" />
                              </div>
                              <span className="text-white">Complete Questionnaire</span>
                            </div>
                            <div className="relative w-12 h-12">
                              <svg className="w-12 h-12 transform -rotate-90">
                                <circle
                                  className="text-white/10"
                                  strokeWidth="2"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r="20"
                                  cx="24"
                                  cy="24"
                                />
                                <circle
                                  className="text-[#34D8F1]"
                                  strokeWidth="2"
                                  strokeDasharray={126}
                                  strokeDashoffset={100}
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r="20"
                                  cx="24"
                                  cy="24"
                                />
                              </svg>
                              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm">20%</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Your Journey Section */}
                    <div className="mb-8">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <svg className="w-5 h-5 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <h3 className="text-white text-2xl font-medium">Your Journey</h3>
                          </div>
                          <span className="text-[#34D8F1] text-lg">Stage 4 of 7</span>
                        </div>

                        {/* Journey Progress */}
                        <div className="w-full h-2 bg-white/10 rounded-full mb-6">
                          <div className="h-full bg-gradient-to-r from-[#34D8F1] to-[#7600FF] rounded-full" style={{ width: '57%' }} />
                        </div>

                        {/* Journey Stages */}
                        <div className="space-y-4">
                          {/* Completed Stages */}
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-[#34D8F1] flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-white block">Initial Assessment</span>
                                <span className="text-white/60 text-sm">Questionnaire completed</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-[#34D8F1] flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-white block">Profile Setup</span>
                                <span className="text-white/60 text-sm">Basic information added</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-[#34D8F1] flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-white block">Preferences Set</span>
                                <span className="text-white/60 text-sm">Match criteria defined</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-[#34D8F1] flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-white block">Initial Matches</span>
                                <span className="text-white/60 text-sm">First connections made</span>
                              </div>
                            </div>
                          </div>

                          {/* Upcoming Stages */}
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white/30 rounded-full" />
                              </div>
                              <div>
                                <span className="text-white block">First Date</span>
                                <span className="text-white/60 text-sm">Pending</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white/30 rounded-full" />
                              </div>
                              <div>
                                <span className="text-white block">Feedback Session</span>
                                <span className="text-white/60 text-sm">Not started</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white/30 rounded-full" />
                              </div>
                              <div>
                                <span className="text-white block">Relationship Status</span>
                                <span className="text-white/60 text-sm">Future milestone</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Messages, Events, and Tips */}
                  <div>
                    {/* Messages Section */}
                    <div className="mb-8">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <svg className="w-5 h-5 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <h3 className="text-white text-2xl font-medium">Messages</h3>
                          </div>
                          <span className="text-[#34D8F1] text-sm">2 new</span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/20">
                            <div className="relative w-12 h-12">
                              <Image
                                src="/placeholder-profile.jpg"
                                alt="Profile"
                                fill
                                className="rounded-full object-cover"
                              />
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#7600FF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium truncate">Emma Thompson</h4>
                                <span className="text-[#34D8F1] text-sm">2m ago</span>
                              </div>
                              <p className="text-white/60 text-sm truncate">Looking forward to our meeting tomorrow!</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/20">
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
                                <h4 className="text-white font-medium truncate">John Davis</h4>
                                <span className="text-white/60 text-sm">1h ago</span>
                              </div>
                              <p className="text-white/60 text-sm truncate">Thanks for the introduction!</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Events Section */}
                    <div className="mb-8">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <svg className="w-5 h-5 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-white text-2xl font-medium">Upcoming Events</h3>
                          </div>
                          <span className="text-[#34D8F1] text-sm">This Week</span>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-medium">Speed Dating Event</h4>
                              <span className="text-[#34D8F1] text-sm">Tomorrow</span>
                            </div>
                            <p className="text-white/60 text-sm mb-3">Join us for an evening of meaningful connections</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white/60">6:00 PM</span>
                              <span className="text-white/40">•</span>
                              <span className="text-white/60">The Grand Hotel</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-white/5 border border-white/20">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-medium">Matchmaking Workshop</h4>
                              <span className="text-white/60 text-sm">Next Week</span>
                            </div>
                            <p className="text-white/60 text-sm mb-3">Learn about our matchmaking process</p>
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
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <svg className="w-5 h-5 text-[#34D8F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h3 className="text-white text-2xl font-medium">Daily Tip</h3>
                        </div>
                        <p className="text-white/80 leading-relaxed">
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
