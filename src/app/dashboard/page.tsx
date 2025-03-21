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
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-blue-50/30 to-white/50" />
        <div className="absolute inset-0 -top-32">
          <OrbField />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm border-b border-gray-100/20">
            <Image
              src="/vettly-logo.png"
              alt="Vettly"
              width={120}
              height={120}
              className="rounded-xl"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto px-8 lg:px-12 py-4 lg:py-6 flex flex-col justify-center">
            {/* Welcome Section with Profile Picture */}
            <section className="text-center">
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4 4L19 7"></path>
                        </svg>
                        Upload Photo
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 className="text-6xl font-medium tracking-tight mb-4 text-white font-playfair">
                Welcome back, Sarah
              </h1>
              <div className="space-y-3 mb-8">
                <p className="text-3xl font-light text-[#34D8F1] tracking-wide">
                  Matchmaking, Revolutionised
                </p>
                <div className="h-8"></div> {/* Spacer to maintain layout */}
              </div>
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
                          <h3 className="text-white text-2xl font-light tracking-wide text-left">Complete Your Profile</h3>
                          <span className="text-purple-400 text-sm font-medium">1 of 2 completed</span>
                        </div>
                        
                        {/* Progress Items */}
                        <div className="space-y-4">
                          <button 
                            onClick={() => window.location.href = '/verification'}
                            className="w-full grid grid-cols-[2rem_1fr_auto] items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-1">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg leading-tight">Profile Setup</h4>
                              <p className="text-white/80 text-sm mt-0.5">Basic information added</p>
                            </div>
                            <div className="text-white text-sm mt-1">Done</div>
                          </button>

                          <button 
                            onClick={() => window.location.href = '/questionnaire'}
                            className="w-full grid grid-cols-[2rem_1fr_auto] items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-1">
                              <div className="w-2 h-2 rounded-full bg-white/50"></div>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg leading-tight">Complete Questionnaire</h4>
                              <p className="text-white/80 text-sm mt-0.5">Help us understand your preferences</p>
                            </div>
                            <div className="text-white text-sm mt-1">Pending</div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Your Journey Section */}
                    <div className="mb-8">
                      <div className="p-8 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 shadow-[0_8px_32px_rgb(31,38,135,0.1)] hover:from-white/15 hover:to-white/10 transition-all duration-500">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-xl">
                              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                              </svg>
                            </div>
                            <h3 className="text-white text-2xl font-light tracking-wide">Your Journey</h3>
                          </div>
                          <span className="text-purple-400 text-sm font-medium px-3 py-1 bg-purple-400/10 rounded-full">3 of 5 completed</span>
                        </div>

                        {/* Journey Stages */}
                        <div className="space-y-1">
                          {/* Stage 1 - Profile Created */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mt-1 shadow-lg shadow-purple-400/20">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg font-light tracking-wide group-hover:text-purple-400 transition-colors duration-300">Profile Created</h4>
                              <p className="text-white/60 text-sm mt-0.5">Your profile is ready</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Arrow 1 */}
                          <div className="flex justify-center items-center h-5">
                            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"></div>
                          </div>

                          {/* Stage 2 - Verification */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mt-1 shadow-lg shadow-purple-400/20">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg font-light tracking-wide group-hover:text-purple-400 transition-colors duration-300">Verification Complete</h4>
                              <p className="text-white/60 text-sm mt-0.5">Questionnaire completed</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Arrow 2 */}
                          <div className="flex justify-center items-center h-5">
                            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"></div>
                          </div>

                          {/* Stage 3 - First Connection */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mt-1 shadow-lg shadow-purple-400/20">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg font-light tracking-wide group-hover:text-purple-400 transition-colors duration-300">First Connection</h4>
                              <p className="text-white/60 text-sm mt-0.5">First connections made</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Arrow 3 */}
                          <div className="flex justify-center items-center h-5">
                            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"></div>
                          </div>

                          {/* Stage 4 - Pending */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg font-light tracking-wide group-hover:text-white/80 transition-colors duration-300">Pending Stage</h4>
                              <p className="text-white/60 text-sm mt-0.5">Pending</p>
                            </div>
                            <div className="text-white/60 text-sm mt-1">Pending</div>
                          </div>

                          {/* Arrow 4 */}
                          <div className="flex justify-center items-center h-5">
                            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"></div>
                          </div>

                          {/* Stage 5 - Not Started */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg font-light tracking-wide group-hover:text-white/80 transition-colors duration-300">Final Stage</h4>
                              <p className="text-white/60 text-sm mt-0.5">Not started</p>
                            </div>
                            <div className="text-white/60 text-sm mt-1">Not started</div>
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
                              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                              </svg>
                            </div>
                            <h3 className="text-white text-xl font-medium">Messages</h3>
                          </div>
                          <button className="text-purple-400 text-sm hover:text-purple-300 transition-colors">View All</button>
                        </div>

                        {/* Message List */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mt-1">
                              <span className="text-white text-sm font-medium">JD</span>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg leading-tight">John Doe</h4>
                              <p className="text-white/80 text-sm mt-0.5">Hey, would you like to meet for coffee?</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1">2m ago</div>
                          </div>

                          <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mt-1">
                              <span className="text-white text-sm font-medium">AS</span>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg leading-tight">Alice Smith</h4>
                              <p className="text-white/80 text-sm mt-0.5">Great meeting you yesterday!</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1">1h ago</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Events Section */}
                    <div className="mb-8">
                      <div className="p-6 rounded-xl backdrop-blur-md bg-gradient-to-b from-white/15 to-white/5 shadow-[0_8px_32px_rgb(31,38,135,0.15)] hover:from-white/20 hover:to-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                            </div>
                            <h3 className="text-white text-xl font-medium">Upcoming Events</h3>
                          </div>
                          <button className="text-purple-400 text-sm hover:text-purple-300 transition-colors">View All</button>
                        </div>

                        {/* Events List */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center mt-1">
                              <span className="text-white text-xs font-medium">MAR</span>
                              <span className="text-white text-sm font-bold">23</span>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg leading-tight">Coffee Meet</h4>
                              <p className="text-white/80 text-sm mt-0.5">2:00 PM • Central Perk</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1">In 2 days</div>
                          </div>

                          <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center mt-1">
                              <span className="text-white text-xs font-medium">MAR</span>
                              <span className="text-white text-sm font-bold">25</span>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg leading-tight">Dinner Date</h4>
                              <p className="text-white/80 text-sm mt-0.5">7:30 PM • Italian Restaurant</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1">In 4 days</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tips & Advice Section */}
                    <div className="mb-8">
                      <div className="p-6 rounded-xl backdrop-blur-md bg-gradient-to-b from-white/15 to-white/5 shadow-[0_8px_32px_rgb(31,38,135,0.15)] hover:from-white/20 hover:to-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                              </svg>
                            </div>
                            <h3 className="text-white text-xl font-medium">Tips & Advice</h3>
                          </div>
                          <button className="text-purple-400 text-sm hover:text-purple-300 transition-colors">View All</button>
                        </div>

                        {/* Tips List */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-1">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg leading-tight">First Date Tips</h4>
                              <p className="text-white/80 text-sm mt-0.5">Essential tips for a successful first date</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1">5 min read</div>
                          </div>

                          <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-1">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-white text-lg leading-tight">Building Connection</h4>
                              <p className="text-white/80 text-sm mt-0.5">How to create meaningful relationships</p>
                            </div>
                            <div className="text-purple-400 text-sm mt-1">7 min read</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden flex items-center justify-center p-4 bg-white/40 backdrop-blur-md border-t border-gray-100/20">
        <div className="flex gap-8">
          {['settings', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`p-3 rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-[#34D8F1]/20 text-[#34D8F1]'
                  : 'text-[#34D8F1]/70 hover:text-[#34D8F1] hover:bg-[#34D8F1]/10'
              }`}
            >
              {tab === 'settings' && (
                <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {tab === 'profile' && (
                <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Desktop Only */}
      <aside className="hidden lg:flex flex-col w-32 bg-white/40 backdrop-blur-md border-l border-gray-100/20">
        <div className="flex flex-col items-center py-12 space-y-12">
          <Image
            src="/vettly-logo.png"
            alt="Vettly"
            width={120}
            height={120}
            className="rounded-xl"
          />
          <div className="flex flex-col space-y-8">
            {['settings', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`p-3 rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-[#34D8F1]/20 text-[#34D8F1]'
                    : 'text-[#34D8F1]/70 hover:text-[#34D8F1] hover:bg-[#34D8F1]/10'
                }`}
              >
                {tab === 'settings' && (
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                {tab === 'profile' && (
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
