'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { OrbField } from '../components/gradients/OrbField';
import { AnimatedText } from '../components/text/AnimatedText';
import Image from 'next/image';
import { inter } from '../fonts';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

// Add JSX type definitions
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface UserData {
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('discover');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileImage, setProfileImage] = useState('/placeholder-profile.jpg');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserData;
            console.log('User data:', data);
            setUserData(data);
            
            // Try to get profile photo URL from user document first, then fall back to auth user photoURL
            const photoUrl = data.profilePhotoUrl || currentUser.photoURL || '/placeholder-profile.jpg';
            console.log('Using profile photo URL:', photoUrl);
            setImageError(false);
            setProfileImage(photoUrl);
          } else {
            console.log('No user document found');
            if (currentUser.photoURL) {
              console.log('Using auth user photoURL:', currentUser.photoURL);
              setImageError(false);
              setProfileImage(currentUser.photoURL);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Still try to use auth user photoURL if available
          if (currentUser.photoURL) {
            console.log('Using auth user photoURL after error:', currentUser.photoURL);
            setImageError(false);
            setProfileImage(currentUser.photoURL);
          }
        }
      } else {
        console.log('No current user');
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    console.log('Profile image updated:', profileImage);
    console.log('Image error state:', imageError);
  }, [profileImage, imageError]);

  const handleImageError = () => {
    console.log('Error loading image:', profileImage);
    setImageError(true);
    setProfileImage('/placeholder-profile.jpg');
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', profileImage);
    setImageError(false);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageError(false);
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
                <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-white/30">
                  <div className="w-full h-full relative">
                    {!imageError && (
                      <Image
                        src={profileImage}
                        alt={userData?.firstName ? `${userData.firstName}'s profile` : 'Profile'}
                        fill
                        sizes="(max-width: 768px) 256px, 288px"
                        priority
                        className="object-cover"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                      />
                    )}
                    {imageError && (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="text-white text-sm font-medium flex items-center gap-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Change Photo
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 className="text-6xl font-medium tracking-tight mb-4 text-white">Welcome back, {userData?.firstName || 'User'}</h1>
              <div className={inter.className}>
                <p className="text-3xl font-light text-[#34D8F1] tracking-wide">Matchmaking, Revolutionised</p>
                <div className="space-y-3 mb-8">
                  <div className="h-8"></div>
                </div>
                {/* All Cards Container */}
                <div className="max-w-6xl mx-auto px-4">
                  {/* Two Column Layout for Desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-8">
                    {/* Left Column - Profile Completion and Journey */}
                    <div className="space-y-8">
                      {/* Complete Your Profile Section */}
                      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl text-white">Complete Your Profile</h3>
                          <span className="text-gray-300 text-sm">1 of 2 completed</span>
                        </div>
                        {/* Progress Items */}
                        <div className="space-y-4">
                          <button 
                            onClick={() => window.location.href = '/verification'}
                            className="w-full grid grid-cols-[2rem_1fr_auto] items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-300 to-cyan-400 flex items-center justify-center mt-1">
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg text-white leading-tight">Profile Setup</h4>
                              <p className="text-white/80 text-sm mt-0.5">Basic information added</p>
                            </div>
                            <div className="text-gray-300 text-sm mt-1">Done</div>
                          </button>

                          <button 
                            onClick={() => window.location.href = '/questionnaire'}
                            className="w-full grid grid-cols-[2rem_1fr_auto] items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg text-white leading-tight">Complete Questionnaire</h4>
                              <p className="text-white/80 text-sm mt-0.5">Help us understand your preferences</p>
                            </div>
                            <div className="text-gray-300 text-sm mt-1">Pending</div>
                          </button>
                        </div>
                      </div>

                      {/* Your Journey Section */}
                      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-xl">
                              <svg className="w-5 h-5" fill="#34D8F1" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                              </svg>
                            </div>
                            <h3 className="text-xl text-white mb-6">Your Journey</h3>
                          </div>
                          <span className="text-gray-300 text-sm">3 of 5 completed</span>
                        </div>

                        {/* Journey Stages */}
                        <div className="space-y-1">
                          {/* Stage 1 - Profile Created */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-300 to-cyan-400 flex items-center justify-center mt-1 shadow-lg shadow-blue-400/20">
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg text-white leading-tight group-hover:text-blue-400 transition-colors duration-300">Profile Created</h4>
                              <p className="text-white/60 text-sm mt-0.5">Your profile is ready</p>
                            </div>
                            <div className="text-gray-300 text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Arrow 1 */}
                          <div className="flex justify-center items-center h-5">
                            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>
                          </div>

                          {/* Stage 2 - Verification */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-300 to-cyan-400 flex items-center justify-center mt-1 shadow-lg shadow-blue-400/20">
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg text-white leading-tight group-hover:text-blue-400 transition-colors duration-300">Verification Complete</h4>
                              <p className="text-white/60 text-sm mt-0.5">Questionnaire completed</p>
                            </div>
                            <div className="text-gray-300 text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Arrow 2 */}
                          <div className="flex justify-center items-center h-5">
                            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>
                          </div>

                          {/* Stage 3 - First Connection */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-300 to-cyan-400 flex items-center justify-center mt-1 shadow-lg shadow-blue-400/20">
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg text-white leading-tight group-hover:text-blue-400 transition-colors duration-300">First Connection</h4>
                              <p className="text-white/60 text-sm mt-0.5">First connections made</p>
                            </div>
                            <div className="text-gray-300 text-sm mt-1 font-medium">Done</div>
                          </div>

                          {/* Arrow 3 */}
                          <div className="flex justify-center items-center h-5">
                            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>
                          </div>

                          {/* Stage 4 - Pending */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg text-white leading-tight group-hover:text-white/80 transition-colors duration-300">Pending Stage</h4>
                              <p className="text-white/60 text-sm mt-0.5">Pending</p>
                            </div>
                            <div className="text-gray-300 text-sm mt-1">Pending</div>
                          </div>

                          {/* Arrow 4 */}
                          <div className="flex justify-center items-center h-5">
                            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>
                          </div>

                          {/* Stage 5 - Not Started */}
                          <div className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg text-white leading-tight group-hover:text-white/80 transition-colors duration-300">Final Stage</h4>
                              <p className="text-white/60 text-sm mt-0.5">Not started</p>
                            </div>
                            <div className="text-gray-300 text-sm mt-1">Not started</div>
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
                                <svg className="w-5 h-5" fill="#34D8F1" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                                </svg>
                              </div>
                              <h3 className="text-xl text-white">Messages</h3>
                            </div>
                            <button className="text-gray-300 text-sm hover:text-white transition-colors">View All</button>
                          </div>

                          {/* Message List */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mt-1">
                                <span className="text-white text-sm font-medium">JD</span>
                              </div>
                              <div className="text-left">
                                <h4 className="text-lg text-white leading-tight">John Doe</h4>
                                <p className="text-white/80 text-sm mt-0.5">Hey, would you like to meet for coffee?</p>
                              </div>
                              <div className="text-gray-300 text-sm mt-1">2m ago</div>
                            </div>

                            <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mt-1">
                                <span className="text-white text-sm font-medium">AS</span>
                              </div>
                              <div className="text-left">
                                <h4 className="text-lg text-white leading-tight">Alice Smith</h4>
                                <p className="text-white/80 text-sm mt-0.5">Great meeting you yesterday!</p>
                              </div>
                              <div className="text-gray-300 text-sm mt-1">1h ago</div>
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
                                <svg className="w-5 h-5" fill="#34D8F1" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                              </div>
                              <h3 className="text-xl text-white">Upcoming Events</h3>
                            </div>
                            <button className="text-gray-300 text-sm hover:text-white transition-colors">View All</button>
                          </div>

                          {/* Events List */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex flex-col items-center justify-center mt-1">
                                <span className="text-white text-xs font-medium">MAR</span>
                                <span className="text-white text-sm font-bold">23</span>
                              </div>
                              <div className="text-left">
                                <h4 className="text-lg text-white leading-tight">Coffee Meet</h4>
                                <p className="text-white/80 text-sm mt-0.5">2:00 PM • Central Perk</p>
                              </div>
                              <div className="text-gray-300 text-sm mt-1">In 2 days</div>
                            </div>

                            <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex flex-col items-center justify-center mt-1">
                                <span className="text-white text-xs font-medium">MAR</span>
                                <span className="text-white text-sm font-bold">25</span>
                              </div>
                              <div className="text-left">
                                <h4 className="text-lg text-white leading-tight">Dinner Date</h4>
                                <p className="text-white/80 text-sm mt-0.5">7:30 PM • Italian Restaurant</p>
                              </div>
                              <div className="text-gray-300 text-sm mt-1">In 4 days</div>
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
                                <svg className="w-5 h-5" fill="#34D8F1" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                              </div>
                              <h3 className="text-xl text-white">Tips & Advice</h3>
                            </div>
                            <button className="text-gray-300 text-sm hover:text-white transition-colors">View All</button>
                          </div>

                          {/* Tips List */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mt-1">
                                <svg className="w-4 h-4" fill="#34D8F1" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                                  <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                              </div>
                              <div className="text-left">
                                <h4 className="text-lg text-white leading-tight">First Date Tips</h4>
                                <p className="text-white/80 text-sm mt-0.5">Essential tips for a successful first date</p>
                              </div>
                              <div className="text-gray-300 text-sm mt-1">5 min read</div>
                            </div>

                            <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mt-1">
                                <svg className="w-4 h-4" fill="#34D8F1" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                </svg>
                              </div>
                              <div className="text-left">
                                <h4 className="text-lg text-white leading-tight">Building Connection</h4>
                                <p className="text-white/80 text-sm mt-0.5">How to create meaningful relationships</p>
                              </div>
                              <div className="text-gray-300 text-sm mt-1">7 min read</div>
                            </div>
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
                <svg className="w-7 h-7" fill="#34D8F1" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              )}
              {tab === 'profile' && (
                <svg className="w-7 h-7" fill="#34D8F1" stroke="none" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
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
                  <svg className="w-7 h-7" fill="#34D8F1" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                )}
                {tab === 'profile' && (
                  <svg className="w-7 h-7" fill="#34D8F1" stroke="none" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
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
